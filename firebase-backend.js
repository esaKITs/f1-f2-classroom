(function(global){
  'use strict';

  const CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const VERSION='1.0.0';
  let readyPromise=null;

  function cfg(){ return global.B1_FIREBASE_CONFIG || null; }
  function configured(){
    const c=cfg();
    return !!(c && c.apiKey && c.authDomain && c.databaseURL && c.projectId && c.appId);
  }
  if(!configured() || !global.firebase){ return; }

  function now(){ return new Date().toISOString(); }
  function randomCode(n){
    const bytes=new Uint8Array(n);
    if(global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(bytes);
    else for(let i=0;i<n;i++) bytes[i]=Math.floor(Math.random()*256);
    let out=''; for(let i=0;i<n;i++) out+=CHARS[bytes[i]%CHARS.length];
    return out;
  }
  function cleanSessionId(v){ return String(v||'').trim().toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,12); }
  function sanitizeId(v){ return String(v||'').trim().replace(/[^A-Za-z0-9_\-ぁ-んァ-ヶ一-龠]/g,'').slice(0,24); }
  function sanitizeName(v){ return String(v||'').trim().replace(/[\r\n\t]+/g,' ').replace(/\s{2,}/g,' ').slice(0,80); }
  function studentUrl(sid){ return global.location.href.split('?')[0]+'?role=student&session='+encodeURIComponent(sid); }
  function errMessage(err,fallback){
    const code=String(err&&err.code||'');
    if(code.includes('PERMISSION_DENIED')||code.includes('permission-denied')) return fallback||'アクセス権を確認できませんでした。';
    return (err&&err.message)||fallback||String(err||'通信エラー');
  }

  async function ensureReady(){
    if(readyPromise) return readyPromise;
    readyPromise=(async()=>{
      if(!global.firebase.apps.length) global.firebase.initializeApp(cfg());
      const auth=global.firebase.auth();
      try{ await auth.setPersistence(global.firebase.auth.Auth.Persistence.LOCAL); }catch(_){ }
      if(!auth.currentUser) await auth.signInAnonymously();
      return {auth,db:global.firebase.database()};
    })();
    try{return await readyPromise;}catch(e){readyPromise=null;throw e;}
  }

  async function readSessionPublic(sid){
    const {db}=await ensureReady();
    const [metaSnap,settingsSnap,pointsSnap]=await Promise.all([
      db.ref('sessions/'+sid+'/meta').once('value'),
      db.ref('sessions/'+sid+'/settings').once('value'),
      db.ref('sessions/'+sid+'/publicPoints').once('value')
    ]);
    const meta=metaSnap.val();
    if(!meta) throw new Error('授業コードが見つかりません。');
    if(meta.active===false) throw new Error('このセッションは終了しています。');
    return {meta,settings:settingsSnap.val()||{},publicPoints:pointsSnap.val()||{}};
  }

  async function isOwner(sid){
    const {auth,db}=await ensureReady();
    try{
      const s=await db.ref('sessions/'+sid+'/private/ownerUid').once('value');
      return s.val()===auth.currentUser.uid;
    }catch(_){ return false; }
  }

  async function requireOwner(sid){
    if(!(await isOwner(sid))) throw new Error('教師用の認証情報を確認できません。セッションコードと再開用キーから再開してください。');
    return ensureReady();
  }

  const api={
    async createSession(sessionName,settings){
      const {auth,db}=await ensureReady();
      const uid=auth.currentUser.uid;
      const safeName=sanitizeName(sessionName)||'F1–F2 Classroom';
      for(let attempt=0;attempt<16;attempt++){
        const sid=randomCode(6), recoveryKey=randomCode(12), t=now();
        const value={
          meta:{sessionId:sid,sessionName:safeName,active:true,createdAt:t,updatedAt:t,version:VERSION},
          settings:settings||{},
          private:{ownerUid:uid,recoveryKey,createdAt:t},
          publicPoints:{},privateRoster:{},claims:{}
        };
        try{
          await db.ref('sessions/'+sid).set(value);
          return {sessionId:sid,sessionName:safeName,teacherToken:uid,recoveryKey,settings:settings||{},studentUrl:studentUrl(sid)};
        }catch(e){
          if(attempt===15) throw new Error(errMessage(e,'セッションコードを発行できませんでした。もう一度お試しください。'));
        }
      }
      throw new Error('セッションコードを発行できませんでした。');
    },

    async resumeSession(sessionId,recoveryKey){
      const sid=cleanSessionId(sessionId), key=String(recoveryKey||'').trim().toUpperCase();
      if(!sid||!key) throw new Error('セッションコードと再開用キーを入力してください。');
      const {auth,db}=await ensureReady();
      const uid=auth.currentUser.uid, claimRef=db.ref('sessions/'+sid+'/claims/'+uid);
      try{
        await claimRef.set({key,at:now()});
      }catch(e){
        throw new Error(errMessage(e,'再開用キーが正しくありません。'));
      }
      try{
        const t=now();
        await db.ref('sessions/'+sid).update({'private/ownerUid':uid,'meta/active':true,'meta/resumedAt':t,'meta/updatedAt':t});
        await claimRef.remove();
        const [metaSnap,settingsSnap,privateSnap]=await Promise.all([
          db.ref('sessions/'+sid+'/meta').once('value'),
          db.ref('sessions/'+sid+'/settings').once('value'),
          db.ref('sessions/'+sid+'/private').once('value')
        ]);
        const meta=metaSnap.val(); if(!meta) throw new Error('授業コードが見つかりません。');
        const priv=privateSnap.val()||{};
        return {sessionId:sid,sessionName:meta.sessionName||'',teacherToken:uid,recoveryKey:priv.recoveryKey||key,settings:settingsSnap.val()||{},studentUrl:studentUrl(sid)};
      }catch(e){
        try{await claimRef.remove();}catch(_){ }
        throw new Error(errMessage(e,'セッションを再開できませんでした。'));
      }
    },

    async updateSessionSettings(sessionId,teacherToken,settings){
      const sid=cleanSessionId(sessionId); const {db}=await requireOwner(sid); const t=now();
      await db.ref('sessions/'+sid).update({settings:settings||{},'meta/updatedAt':t});
      return {ok:true,settings:settings||{},updatedAt:t};
    },

    async closeSession(sessionId,teacherToken){
      const sid=cleanSessionId(sessionId); const {db}=await requireOwner(sid); const t=now();
      await db.ref('sessions/'+sid+'/meta').update({active:false,closedAt:t,updatedAt:t});
      return {ok:true,closedAt:t};
    },

    async getSessionSnapshot(sessionId,teacherToken,participantId){
      const sid=cleanSessionId(sessionId); if(!sid) throw new Error('授業コードを入力してください。');
      const {auth,db}=await ensureReady();
      const pub=await readSessionPublic(sid);
      const teacherAuthorized=!!teacherToken && await isOwner(sid);
      let roster={};
      if(teacherAuthorized){
        try{ roster=(await db.ref('sessions/'+sid+'/privateRoster').once('value')).val()||{}; }catch(_){ roster={}; }
      }
      const ownUid=auth.currentUser.uid, ownId=sanitizeId(participantId);
      const data=[]; let participantCount=0;
      Object.entries(pub.publicPoints||{}).forEach(([uid,p])=>{
        if(!p||!p.records)return; participantCount++;
        const pid=teacherAuthorized ? sanitizeId(roster[uid]&&roster[uid].participantId) : (uid===ownUid?ownId:'');
        Object.values(p.records||{}).forEach(r=>{
          if(!r)return;
          data.push({timestamp:r.timestamp||p.updatedAt||'',participantId:pid,sex:p.sex||'noanswer',language:String(r.language||''),vowelKey:String(r.vowelKey||''),vowel:String(r.vowel||r.vowelKey||''),f1:Number(r.f1),f2:Number(r.f2)});
        });
      });
      return {sessionName:pub.meta.sessionName||'',settings:pub.settings||{},data,participantCount,dataPointCount:data.length,studentUrl:studentUrl(sid),teacherAuthorized,serverTime:now()};
    },

    async submitStudentData(sessionId,participantId,sex,records){
      const sid=cleanSessionId(sessionId), pid=sanitizeId(participantId);
      if(!sid) throw new Error('授業コードを入力してください。');
      if(!pid) throw new Error('IDを入力してください。');
      if(!Array.isArray(records)||!records.length) throw new Error('F1/F2データがありません。');
      const pub=await readSessionPublic(sid);
      if(pub.meta.active===false) throw new Error('このセッションは終了しています。');
      const {auth,db}=await ensureReady(); const uid=auth.currentUser.uid, t=now();
      const clean=[];
      records.forEach(r=>{
        const f1=Number(r.f1),f2=Number(r.f2),key=String(r.vowelKey||'').trim();
        if(!key||!Number.isFinite(f1)||!Number.isFinite(f2))return;
        if(f1<100||f1>2500||f2<200||f2>6000)throw new Error((r.vowel||key)+' の値を確認してください。');
        clean.push({vowelKey:key,language:String(r.language||''),vowel:String(r.vowel||key),f1,f2,timestamp:t});
      });
      if(!clean.length) throw new Error('有効なデータがありません。');
      const updates={};
      clean.forEach(r=>{ updates['sessions/'+sid+'/publicPoints/'+uid+'/records/'+r.vowelKey]=r; });
      updates['sessions/'+sid+'/publicPoints/'+uid+'/sex']=String(sex||'noanswer');
      updates['sessions/'+sid+'/publicPoints/'+uid+'/updatedAt']=t;
      updates['sessions/'+sid+'/privateRoster/'+uid]={participantId:pid,sex:String(sex||'noanswer'),updatedAt:t};
      try{ await db.ref().update(updates); }
      catch(e){ throw new Error(errMessage(e,'データを送信できませんでした。セッションが終了していないか確認してください。')); }
      return {ok:true,saved:clean.length,serverTime:t};
    }
  };

  function chain(success,failure){
    const c={
      _success:success||null,_failure:failure||null,
      withSuccessHandler(fn){this._success=fn;return this;},
      withFailureHandler(fn){this._failure=fn;return this;}
    };
    Object.keys(api).forEach(name=>{c[name]=function(){const args=[...arguments];api[name](...args).then(v=>{if(this._success)this._success(v);}).catch(e=>{if(this._failure)this._failure(e);else console.error(e);});return undefined;};});
    return c;
  }
  const run=chain();
  run.withSuccessHandler=function(fn){return chain(fn,null);};
  run.withFailureHandler=function(fn){return chain(null,fn);};

  global.B1Backend={run,api,ensureReady,isConfigured:true,kind:'firebase-rtdb',version:VERSION};
})(window);
