/*
 * F1–F2 Classroom bilingual UI layer (Japanese / English)
 * Copyright 2026 Tetsuya Esaki / esaKITs — Enhanced Smart AI Kits
 * Licensed under the Apache License, Version 2.0.
 */
(function bootstrap(TRANSLATIONS){
  'use strict';
  const STORAGE_KEY='f1f2-ui-language-v1';
  const textOriginal=new WeakMap();
  const attrOriginal=new WeakMap();
  let mutating=false, observer=null;
  function initialLanguage(){
    try{
      const q=new URLSearchParams(location.search).get('lang');
      if(q==='en'||q==='ja') return q;
      const saved=localStorage.getItem(STORAGE_KEY);
      if(saved==='en'||saved==='ja') return saved;
    }catch(_){}
    return 'ja';
  }
  let language=initialLanguage();
  function translateDynamic(s){
    let m;
    if((m=s.match(/^同期\s+(.+)$/))) return 'Synced '+m[1];
    if((m=s.match(/^(\d+)件を送信しました。$/))) return `${m[1]} record${m[1]==='1'?'':'s'} submitted.`;
    if((m=s.match(/^(\d+)点を読み込みました$/))) return `Loaded ${m[1]} data point${m[1]==='1'?'':'s'}.`;
    if((m=s.match(/^(\d+)\/(\d+)人 完了 ・ 対象 (\d+)母音$/))) return `${m[1]}/${m[2]} participants complete · ${m[3]} vowels`;
    if((m=s.match(/^(.+) の値を確認してください（F1: 100–2500 Hz、F2: 200–6000 Hz）。$/))) return `Check the values for ${m[1]} (F1: 100–2500 Hz; F2: 200–6000 Hz).`;
    if((m=s.match(/^(.+) の値を確認してください。$/))) return `Please check the value for ${m[1]}.`;
    if((m=s.match(/^(.+) は既にあります。選択対象に追加しました。$/))) return `${m[1]} already exists and has been added to the selection.`;
    if((m=s.match(/^「(.+)」をこのブラウザに保存しました。$/))) return `Saved “${m[1]}” in this browser.`;
    if((m=s.match(/^「(.+)」を読み込みました。$/))) return `Loaded “${m[1]}”.`;
    if((m=s.match(/^「(.+)」を削除しました。$/))) return `Deleted “${m[1]}”.`;
    if((m=s.match(/^(.+)：(\d+)頂点 ／ (.+)：(\d+)頂点 ／ 共通 (\d+)母音$/))) return `${translateString(m[1])}: ${m[2]} vertices / ${translateString(m[3])}: ${m[4]} vertices / ${m[5]} shared vowels`;
    if((m=s.match(/^(.+) — 95%分布楕円$/))) return `${m[1]} — 95% distribution ellipse`;
    if((m=s.match(/^(.+) — 95%信頼楕円$/))) return `${m[1]} — 95% confidence ellipse`;
    if((m=s.match(/^n=(\d+) 中心：F2=([^,]+), F1=(.+)$/))) return `n=${m[1]} Center: F2=${m[2]}, F1=${m[3]}`;
    if((m=s.match(/^(.+) の平均$/))) return `Mean for ${m[1]}`;
    if((m=s.match(/^平均F1:\s*(.+)$/))) return `Mean F1: ${m[1]}`;
    if((m=s.match(/^平均F2:\s*(.+)$/))) return `Mean F2: ${m[1]}`;
    if((m=s.match(/^(.+) (95%分布楕円|95%信頼楕円) \(n=(\d+)\)([\s\S]*)$/))) return `${m[1]} ${translateString(m[2])} (n=${m[3]})${m[4]}`;
    return null;
  }
  function translateString(value){
    const s=String(value??'');
    if(language!=='en') return s;
    if(Object.prototype.hasOwnProperty.call(TRANSLATIONS,s)) return TRANSLATIONS[s];
    const dyn=translateDynamic(s); return dyn!==null?dyn:s;
  }
  function translateMultiline(value){
    if(language!=='en') return String(value??'');
    return String(value??'').split(/(\r?\n)/).map(part=>/^(\r?\n)$/.test(part)?part:translateString(part)).join('');
  }
  function isSkippedElement(el){
    if(!el||el.nodeType!==1) return false;
    if(el.closest('[data-i18n-skip]')) return true;
    if(el.closest('input,textarea,[contenteditable="true"]')) return true;
    if(el.closest('#topStat,#studentSessionName,#studentSessionCode,.code,.recovery-key,.urlbox')) return true;
    if(el.closest('.status-table td:first-child,.custom-vowel-item .meta')) return true;
    return false;
  }
  function renderedText(original){
    const lead=(original.match(/^\s*/)||[''])[0], trail=(original.match(/\s*$/)||[''])[0];
    const core=original.slice(lead.length, original.length-trail.length);
    if(!core) return original;
    return lead+(language==='en'?translateString(core):core)+trail;
  }
  function translateTextNode(node, forceOriginalUpdate=false){
    if(!node||node.nodeType!==3||!node.parentElement||isSkippedElement(node.parentElement)) return;
    const current=node.nodeValue||'';
    if(forceOriginalUpdate&&textOriginal.has(node)){
      const known=textOriginal.get(node)??'';
      if(current===renderedText(known)) forceOriginalUpdate=false;
    }
    if(forceOriginalUpdate||!textOriginal.has(node)) textOriginal.set(node,current);
    const next=renderedText(textOriginal.get(node)??current);
    if(node.nodeValue!==next){mutating=true;node.nodeValue=next;mutating=false;}
  }
  const ATTRS=['placeholder','title','aria-label'];
  function translateAttributes(el, forceOriginalUpdate=false){
    if(!el||el.nodeType!==1||el.closest('[data-i18n-skip]')) return;
    let originals=attrOriginal.get(el);
    if(!originals){originals={};attrOriginal.set(el,originals);}
    ATTRS.forEach(name=>{
      if(!el.hasAttribute(name)) return;
      const current=el.getAttribute(name)||'';
      if(forceOriginalUpdate&&(name in originals)){
        const known=originals[name]??'';
        const rendered=language==='en'?translateString(known):known;
        if(current===rendered) forceOriginalUpdate=false;
      }
      if(forceOriginalUpdate||!(name in originals)) originals[name]=current;
      const original=originals[name]??current;
      const target=language==='en'?translateString(original):original;
      if(current!==target){mutating=true;el.setAttribute(name,target);mutating=false;}
    });
  }
  function walk(root, forceOriginalUpdate=false){
    if(!root) return;
    if(root.nodeType===3){translateTextNode(root,forceOriginalUpdate);return;}
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11) return;
    if(root.nodeType===1) translateAttributes(root,forceOriginalUpdate);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
    let n;
    while((n=walker.nextNode())) n.nodeType===3?translateTextNode(n,forceOriginalUpdate):translateAttributes(n,forceOriginalUpdate);
  }
  function updateToggle(){
    const b=document.getElementById('f1f2LangToggle'); if(!b) return;
    b.textContent=language==='en'?'日本語':'EN';
    b.setAttribute('aria-label',language==='en'?'Switch to Japanese':'英語に切り替え');
    b.title=language==='en'?'Switch to Japanese':'英語に切り替え';
  }
  function applyLanguage(next,persist=true){
    language=next==='en'?'en':'ja'; document.documentElement.lang=language;
    if(persist){try{localStorage.setItem(STORAGE_KEY,language)}catch(_){}}
    walk(document.body,false); updateToggle();
    try{if(typeof window.renderAll==='function') window.renderAll();}catch(_){}
    requestAnimationFrame(()=>walk(document.body,false));
    try{window.dispatchEvent(new CustomEvent('f1f2languagechange',{detail:{language}}));}catch(_){}
  }
  function installToggle(){
    if(document.getElementById('f1f2LangToggle')) return;
    const header=document.querySelector('header'); if(!header) return;
    const style=document.createElement('style');
    style.textContent='#f1f2LangToggle{border:1px solid #64748b;background:#fff;color:#0f172a;border-radius:999px;padding:5px 9px;min-width:38px;font-size:11px;font-weight:800;line-height:1.2;white-space:nowrap;box-shadow:none}#f1f2LangToggle:hover{background:#f8fafc}@media(max-width:720px){#f1f2LangToggle{padding:5px 7px;min-width:34px}}';
    document.head.appendChild(style);
    const b=document.createElement('button'); b.id='f1f2LangToggle'; b.type='button'; b.dataset.i18nSkip='';
    b.addEventListener('click',()=>applyLanguage(language==='en'?'ja':'en',true));
    header.insertBefore(b,header.querySelector('.spacer')||null); updateToggle();
  }
  function installObserver(){
    observer=new MutationObserver(mutations=>{
      if(mutating) return;
      for(const m of mutations){
        if(m.type==='characterData') translateTextNode(m.target,true);
        else if(m.type==='attributes') translateAttributes(m.target,true);
        else if(m.type==='childList') m.addedNodes.forEach(n=>walk(n,true));
      }
    });
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTRS});
  }
  function installCanvasTranslation(){
    if(!window.CanvasRenderingContext2D) return;
    const p=CanvasRenderingContext2D.prototype;
    if(!p.__f1f2FillText){p.__f1f2FillText=p.fillText;p.fillText=function(text,x,y,maxWidth){const t=translateString(text);return arguments.length>=4?p.__f1f2FillText.call(this,t,x,y,maxWidth):p.__f1f2FillText.call(this,t,x,y);};}
    if(p.strokeText&&!p.__f1f2StrokeText){p.__f1f2StrokeText=p.strokeText;p.strokeText=function(text,x,y,maxWidth){const t=translateString(text);return arguments.length>=4?p.__f1f2StrokeText.call(this,t,x,y,maxWidth):p.__f1f2StrokeText.call(this,t,x,y);};}
  }
  function installDialogTranslation(){
    const oc=window.confirm; window.confirm=function(message){return oc.call(window,translateString(message));};
    const oa=window.alert; window.alert=function(message){return oa.call(window,translateString(message));};
  }
  function installClipboardTranslation(){
    try{
      const cb=navigator.clipboard; if(!cb||!cb.writeText||cb.__f1f2Wrapped) return;
      const ow=cb.writeText.bind(cb); cb.writeText=function(text){return ow(language==='en'?translateMultiline(text):text);}; cb.__f1f2Wrapped=true;
    }catch(_){}
  }
  function installSvgExportTranslation(){
    const wrap=()=>{
      if(typeof window.downloadBlob!=='function'||window.downloadBlob.__f1f2Wrapped) return false;
      const original=window.downloadBlob;
      function wrapped(blob,name){
        const filename=String(name||'');
        if(language==='en'&&blob&&(filename.toLowerCase().endsWith('.svg')||String(blob.type||'').includes('svg'))){
          blob.text().then(txt=>{
            try{
              const doc=new DOMParser().parseFromString(txt,'image/svg+xml');
              const walker=doc.createTreeWalker(doc.documentElement,NodeFilter.SHOW_TEXT);
              let n; while((n=walker.nextNode())) n.nodeValue=translateString(n.nodeValue||'');
              const out=new XMLSerializer().serializeToString(doc);
              original(new Blob([out],{type:blob.type||'image/svg+xml;charset=utf-8'}),name);
            }catch(_){original(blob,name);}
          }).catch(()=>original(blob,name)); return;
        }
        return original(blob,name);
      }
      wrapped.__f1f2Wrapped=true; window.downloadBlob=wrapped; return true;
    };
    if(!wrap()) window.addEventListener('load',wrap,{once:true});
  }
  installCanvasTranslation(); installDialogTranslation(); installClipboardTranslation(); installSvgExportTranslation();
  installToggle(); walk(document.body,true); installObserver(); applyLanguage(language,false);
  window.F1F2_I18N={get language(){return language;},setLanguage:applyLanguage,t:translateString,translations:TRANSLATIONS};
})({"母音空間をクラスで共有":"Share the vowel space with your class","未接続":"Disconnected","更新":"Refresh","プレビューモードです。Firebase設定が未設定、またはバックエンドに接続できないため、見た目と操作だけを試しています。公開版では教師・学生とも公開URLを開くだけで利用します。":"Preview mode. Firebase is not configured or the backend is unavailable, so you can only try the interface and controls. In the published version, both teachers and students can use the tool simply by opening the public URL.","セッション":"Session","例：English Phonetics 8/18":"e.g., English Phonetics 8/18","授業・セッション名":"Class / session name","新しいセッション":"New session","セッションを再開":"Resume session","例：A7K3...":"e.g., A7K3...","12文字":"12 characters","セッションコード":"Session code","再開用キー":"Recovery key","再開する":"Resume","教師PCの電源を落としても、セッションコードと再開用キーがあれば同じ授業を復旧できます。":"Even if you shut down the teacher's computer, you can restore the same class session using the session code and recovery key.","URLをコピー":"Copy URL","学生画面を開く":"Open student view","再開情報をコピー":"Copy recovery information","PCを閉じる前に、セッションコードと再開用キーを控えてください。":"Before shutting down your computer, make a note of the session code and recovery key.","学生参加URL":"Student join URL","QRコードも表示":"Show QR code","授業モード":"Classroom mode","日本語5母音":"Japanese 5 vowels","米国英語・短母音":"American English: short vowels","米国英語・長母音":"American English: long vowels","統計比較":"Statistical comparison","自由選択":"Custom selection","標準モードを選ぶだけで授業を開始できます。母音・色・形を細かく変える場合だけ右側の「詳細設定」を開きます。":"Simply choose a standard mode to start the class. Open “Advanced settings” on the right only if you want to fine-tune vowels, colors, or marker shapes.","F1–F2 母音空間":"F1–F2 vowel space","F1：右側／F2：上側":"F1: right side / F2: top","全画面":"Full screen","全画面を終了":"Exit full screen","グラフの高さを調整":"Adjust graph height","ドラッグしてグラフの高さを変更":"Drag to change the graph height","集計":"Summary","言語":"Language","母音":"Vowel","平均F1":"Mean F1","平均F2":"Mean F2","グラフと設定欄の幅を調整":"Adjust graph and settings panel widths","ドラッグして右メニューの幅を変更":"Drag to change the width of the right-hand panel","入力状況の詳細を表示":"Show input-status details","入力状況":"Input status","詳細を見る":"View details","参加者":"Participants","全データ":"All data","表示中":"Visible","表示":"Display","例：S014":"e.g., S014","表示対象":"Display subset","全体":"All","男性":"Male","女性":"Female","★で強調するID":"ID to highlight with ★","グラフスタイル":"Graph style","標準（上品）":"Standard (Elegant)","高視認":"High visibility","シンプル":"Simple","カスタム":"Custom","個々の点":"Individual points","平均":"Mean","参照データ":"Reference data","凡例":"Legend","グリッド":"Grid","F1/F2値を図上に表示":"Show F1/F2 values on the graph","表示しない":"Hide","平均だけ":"Mean only","強調IDだけ":"Highlighted ID only","F1・F2":"F1 & F2","F1のみ":"F1 only","F2のみ":"F2 only","母音を線で結ぶ":"Connect vowels with lines","結ばない":"Do not connect","クラス平均":"Class mean","強調ID":"Highlighted ID","平均＋強調ID":"Mean + highlighted ID","同じ音素の参照値へ矢印":"Arrow to the reference value for the same phoneme","表示中の母音だけを順に結び、3点以上なら最後から最初へ戻して閉じます。":"Connect only the visible vowels in order. With three or more points, the line closes by returning from the last point to the first.","2つの多角形を比較":"Compare two polygons","比較A":"Comparison A","表示中の平均":"Mean of visible data","クラス全体平均":"Overall class mean","男性平均":"Male mean","女性平均":"Female mean","回答しない平均":"No-response mean","参照データ平均":"Reference-data mean","比較B":"Comparison B","対応する母音の頂点どうしを結ぶ":"Connect corresponding vowel vertices","共通する表示母音を対応させ、3頂点以上なら閉じた多角形として重ねます。":"Match vowels that are visible in both sets and overlay them as closed polygons when there are three or more vertices.","凡例位置":"Legend position","左下":"Bottom left","右下":"Bottom right","左上":"Top left","右上":"Top right","分布楕円と信頼楕円の説明":"About distribution and confidence ellipses","95%分布楕円":"95% distribution ellipse","95%信頼楕円":"95% confidence ellipse","両方":"Both","母音・スタイル":"Vowels & style","通常は授業モードのままで使えます。":"You can normally use the tool as is in Classroom mode.","詳細設定を開く":"Open advanced settings","日本語":"Japanese","5母音を追加":"Add 5 vowels","短母音を追加":"Add short vowels","長母音を追加":"Add long vowels","音素を自由に追加":"Add phonemes manually","英語":"English","例：/æ/ または æ":"e.g., /æ/ or æ","音素":"Phoneme","例：stack":"e.g., stack","例語・メモ（任意）":"Example word / note (optional)","音素を追加":"Add phoneme","独自母音セット":"Custom vowel sets","例：stack–stuck–stock":"e.g., stack–stuck–stock","現在のセットを保存":"Save current set","保存済みセット":"Saved sets","読み込む":"Load","削除":"Delete","このブラウザに保存します。セッションへ反映すると参加者画面にも同じ音素セットが表示されます。":"Saved in this browser. When applied to the session, the same phoneme set will also appear on participant screens.","色分け":"Color coding","母音ごと":"By vowel","言語ごと":"By language","形":"Shape","言語色":"Language color","日本語の点の形":"Japanese marker shape","英語の点の形":"English marker shape","色・形をデフォルトに戻す":"Reset colors and shapes to defaults","点・平均":"Points & means","個々の点の大きさ":"Individual point size","個々の点の濃さ":"Individual point opacity","平均の大きさ":"Mean marker size","音素ラベル":"Phoneme label","丸バッジ":"Round badge","文字のみ":"Text only","楕円の線":"Ellipse lines","色":"Color","母音色に連動":"Match vowel color","任意の色":"Custom color","95%分布楕円の色":"95% distribution ellipse color","線":"Line","実線":"Solid","破線":"Dashed","点線":"Dotted","太さ":"Width","塗り":"Fill","95%信頼楕円の色":"95% confidence ellipse color","「母音色に連動」が標準です。任意の色を選んだ場合だけ色指定が使われます。":"“Match vowel color” is the default. The custom color setting is used only when “Custom color” is selected.","音素記号":"Phoneme symbols","フォント":"Font","游ゴシック":"Yu Gothic","メイリオ":"Meiryo","標準ゴシック":"Default sans serif","明朝系":"Serif","大きさ":"Size","グラフ内の母音記号、凡例、学生入力画面の母音記号に共通して反映します。":"Applies to vowel symbols in the graph, the legend, and the student input screen.","選択中の母音色":"Selected vowel colors","グリッド・目盛":"Grid & tick marks","濃さ":"Opacity","目盛文字":"Tick labels","F1 間隔":"F1 interval","F2 間隔":"F2 interval","標準は以前と同程度の濃さです。投影時は濃く、配布図では薄くするなど調整できます。":"The default opacity is about the same as before. You can make it darker for projection or lighter for handouts.","平均の点":"Mean marker","塗り色":"Fill color","輪郭線を表示":"Show outline","輪郭色":"Outline color","輪郭太さ":"Outline width","通常の結線":"Standard connecting lines","平均線の色":"Mean line color","平均線":"Mean line","強調ID線の色":"Highlighted-ID line color","強調ID線":"Highlighted-ID line","参照矢印の色":"Reference-arrow color","参照矢印":"Reference arrow","多角形比較 A":"Polygon comparison A","塗りの濃さ":"Fill opacity","多角形比較 B":"Polygon comparison B","頂点を表示":"Show vertices","母音ラベルを表示":"Show vowel labels","頂点サイズ":"Vertex size","頂点対応線":"Vertex connector","比較A/Bは共通する表示母音を対応させます。3点以上なら閉じ、2点なら1本の線、1点以下なら線を描きません。":"Comparisons A and B match vowels that are visible in both sets. Three or more points form a closed polygon; two points form a single line; one or no points produce no line.","図内タイトル":"Title inside graph","例：日本語5母音のF1–F2分布":"e.g., F1–F2 distribution of the five Japanese vowels","タイトル":"Title","タイトルは図内で直接ドラッグして自由に移動できます。":"Drag the title directly within the graph to position it freely.","タイトルのフォント":"Title font","目盛のフォント":"Tick-label font","タイトルと F1 / F2 の軸名・単位は、図内で直接ドラッグして自由に配置できます。":"Drag the title and the F1/F2 axis names and units directly within the graph to position them freely.","単位・軸名のフォント":"Axis-name and unit font","タイトル位置を中央上部に戻す":"Reset title position to top center","軸の表示範囲":"Axis display range","この設定をセッションに反映":"Apply these settings to the session","参照データ・保存":"Reference data & export","母語話者などの参照データをCSVで読み込み、クラスデータに重ねられます。":"Load reference data such as native-speaker data from a CSV file and overlay it on the class data.","列：language, vowel, f1, f2（languageは省略可）":"Columns: language, vowel, f1, f2 (language is optional)","未読込":"Not loaded","図を書き出す":"Export graph","背景":"Background","白":"White","透明":"Transparent","PNG解像度":"PNG resolution","3×（推奨）":"3× (recommended)","PNG保存":"Save PNG","SVG保存":"Save SVG","図をコピー":"Copy graph","楕円の式":"Ellipse equations","図だけを書き出します。PNGは高解像度、SVGはベクター形式です。":"Exports the graph only. PNG is high-resolution; SVG is a vector format.","データを書き出す":"Export data","CSV保存":"Save CSV","Excel保存":"Save Excel","セッション管理":"Session management","セッションを終了":"End session","教師用URLを持つ人だけが設定変更・終了できます。":"Only someone with the teacher URL can change settings or end the session.","入力":"Input","例：AB12CD":"e.g., AB12CD","授業コード":"Class code","参加":"Join","参加URLから開いた場合は自動入力されます。":"Automatically filled in when opened from the join URL.","この授業で選択されている母音だけが表示されます。":"Only the vowels selected for this class are shown.","ID（ニックネーム可）":"ID (nickname allowed)","氏名・学籍番号などの個人情報を使わず、授業内IDの利用を推奨します。":"We recommend using an in-class ID rather than personal information such as your name or student number.","性別（任意）":"Sex (optional)","回答しない":"Prefer not to answer","クラスに送信／更新":"Submit / update class data","PCでPraat等と併用し、測定したF1/F2値を入力する想定です。":"Use this alongside Praat or similar software on a computer and enter the F1/F2 values you measured.","クラスの中の自分 ★":"My position in the class ★","★＝自分 薄い記号＝クラスの個々のデータ 濃い大きな記号＝平均 楕円設定は教師画面と共通":"★ = you   Faint symbols = individual class data   Large dark symbols = mean   Ellipse settings are shared with the teacher view","コード":"Code","最新の状態を取得":"Get latest data","閉じる":"Close","性別":"Sex","未入力":"Not entered","データ点":"Data points","最終更新":"Last updated","値":"Values","楕円の説明":"About ellipses","楕円について":"Ellipses","個々のデータが、平均のまわりにどのくらい広く散らばっているかを示します。楕円が大きいほど、個人差や測定値のばらつきが大きいことを表します。":"Shows how widely the individual data are spread around the mean. A larger ellipse indicates greater individual variation or greater variability in the measurements.","データから求めた平均値について、母集団の本当の平均がどのあたりにあると推定されるかを示します。楕円が小さいほど、平均値の位置をより精確に推定できていることを表します。":"For the mean estimated from the data, this shows the region in which the true population mean is estimated to lie. A smaller ellipse indicates that the position of the mean has been estimated more precisely.","両方を表示すると":"When both are shown","外側の分布楕円で「個々のデータがどれくらい散らばっているか」、内側の信頼楕円で「そのデータから平均の位置をどれくらい精確に推定できるか」を同時に確認できます。":"The outer distribution ellipse shows how widely the individual data are spread, while the inner confidence ellipse shows how precisely the location of the mean can be estimated from those data.","※ 信頼楕円は「データの95%が入る範囲」ではありません。":"Note: The confidence ellipse is not the region containing 95% of the data.","計算方法（概要）":"Calculation method (overview)","95%分布楕円：標本平均と標本共分散行列 S を用い、(x−μ)ᵀS⁻¹(x−μ) = χ²₂(.95) = 5.991 を境界とします。":"95% distribution ellipse: Using the sample mean and sample covariance matrix S, the boundary is defined by (x−μ)ᵀS⁻¹(x−μ) = χ²₂(.95) = 5.991.","95%信頼楕円：母平均の95%信頼領域として、Hotelling の T² に基づく係数を用います。いずれも n < 5 では表示しません。":"95% confidence ellipse: The 95% confidence region for the population mean is calculated using a coefficient based on Hotelling’s T². Neither ellipse is displayed when n < 5.","表示中の楕円の式":"Equations for displayed ellipses","x = F2 (Hz)、y = F1 (Hz)。現在の表示対象・楕円モードから算出します。楕円式は A x² + B xy + C y² + D x + E y + F = 0 の形で表示します。":"x = F2 (Hz), y = F1 (Hz). Calculated from the current display subset and ellipse mode. The ellipse equation is shown in the form A x² + B xy + C y² + D x + E y + F = 0.","すべてコピー":"Copy all","同期":"Synced","再接続中":"Reconnecting","プレビュー":"Preview","授業コードを入力して参加してください。":"Enter the class code to join.","セッションを作成中…":"Creating session…","プレビュー授業":"Preview class","新しいプレビューセッションを作成しました。グラフは学生が送信するまで空です。":"A new preview session has been created. The graph will remain empty until students submit data.","セッションを作成しました。学生は参加URLを開くだけです。":"Session created. Students only need to open the join URL.","QRコードを作成できませんでした。参加URLをご利用ください。":"Could not create the QR code. Please use the join URL.","再開情報がありません。":"No recovery information is available.","再開情報をコピーしました。":"Recovery information copied.","コピーできませんでした。画面のコードを控えてください。":"Could not copy. Please make a note of the code shown on screen.","画面のセッションコードと再開用キーを控えてください。":"Make a note of the session code and recovery key shown on screen.","セッションコードと再開用キーを入力してください。":"Enter the session code and recovery key.","セッションを再開しています…":"Resuming session…","保存されたプレビューセッションが見つかりません。":"Saved preview session not found.","再開用キーが正しくありません。":"The recovery key is incorrect.","プレビューセッションを再開しました。":"Preview session resumed.","セッションを再開しました。":"Session resumed.","参加URLがありません。":"No join URL is available.","参加URLをコピーしました。":"Join URL copied.","コピーできませんでした。URL欄からコピーしてください。":"Could not copy. Please copy it from the URL field.","このブラウザでは自動コピーできません。URL欄からコピーしてください。":"Automatic copying is not available in this browser. Please copy it from the URL field.","先にセッションを作成してください。":"Create a session first.","プレビュー設定を反映しました。":"Preview settings applied.","学生画面にもこの母音設定を反映しました。":"These vowel settings have also been applied to the student view.","セッションがありません。":"No session is available.","このセッションを終了しますか？":"End this session?","終了":"End","プレビューセッションを終了しました。":"Preview session ended.","セッションを終了しました。":"Session ended.","要再開":"Resume required","教師用の認証情報を確認できません。セッションコードと再開用キーから「セッションを再開」してください。":"Teacher authentication could not be verified. Please resume the session using the session code and recovery key.","授業コードを入力してください。":"Enter the class code.","授業に接続しています…":"Connecting to class…","この授業コードのプレビューセッションが見つかりません。教師画面で新しいセッションを作成してください。":"No preview session was found for this class code. Create a new session in the teacher view.","授業に参加しました。教師が選択した母音を入力できます。":"You have joined the class. Enter the vowels selected by the teacher.","先に授業コードを入力して参加してください。":"Enter the class code and join first.","IDを入力してください。":"Enter an ID.","F1/F2を1組以上入力してください。":"Enter at least one pair of F1/F2 values.","プレビューに反映しました。★が自分のデータです。":"Applied to preview. ★ marks your data.","追加する音素を入力してください。":"Enter a phoneme to add.","セット名を入力してください。":"Enter a set name.","このブラウザにセットを保存できませんでした。":"Could not save the set in this browser.","読み込むセットを選んでください。":"Select a set to load.","削除するセットを選んでください。":"Select a set to delete.","現在は楕円を表示していません。楕円モードを選ぶと式を表示できます。":"No ellipses are currently displayed. Select an ellipse mode to show the equations.","式を求められる楕円がありません。各音素で n≥5 かつ共分散行列が正則である必要があります。":"No ellipse equation can be calculated. Each phoneme requires n ≥ 5 and a nonsingular covariance matrix.","コピーできる楕円式がありません。":"No ellipse equations are available to copy.","F1–F2 Classroom 楕円式":"F1–F2 Classroom ellipse equations","楕円式をコピーしました。":"Ellipse equations copied.","コピーできませんでした。":"Could not copy.","このブラウザでは自動コピーできません。":"Automatic copying is not available in this browser.","PNGを作成できませんでした。":"Could not create the PNG.","高解像度PNGを保存しました。":"High-resolution PNG saved.","図を作成できませんでした。":"Could not create the graph.","図をクリップボードにコピーしました。":"Graph copied to the clipboard.","このブラウザ／接続方法では画像コピーを利用できません。PNG保存をご利用ください。":"Image copying is not available in this browser or connection mode. Please use Save PNG.","SVGを保存しました。":"SVG saved.","SVGを作成できませんでした。":"Could not create the SVG.","95%分布楕円＋95%信頼楕円":"95% distribution ellipse + 95% confidence ellipse","楕円なし":"No ellipse","個々のデータの広がりと、平均値の推定範囲を同時表示（n≥5）":"Shows both the spread of individual data and the estimated range of the mean (n ≥ 5)","平均F1・F2の95%信頼領域（n≥5）":"95% confidence region for mean F1 and F2 (n ≥ 5)","個々のF1・F2の広がり（n≥5）":"Spread of individual F1/F2 data (n ≥ 5)","楕円を表示しません":"Do not show ellipses","日":"JP","英":"EN","自分／指定ID":"You / specified ID","全画面表示を開始できませんでした。":"Could not enter full-screen mode.","このブラウザでは全画面表示を利用できません。":"Full-screen mode is not available in this browser.","入力状況を表示できませんでした。画面を再読み込みして、もう一度「詳細を見る」を押してください。":"Could not display the input status. Reload the page and click “View details” again.","表示エラー":"Display error","値を見る":"View values","★ 自分／指定ID":"★ You / specified ID","まだデータがありません":"No data yet","読み込みに失敗しました：":"Failed to load:","データがありません":"No data","vowel, f1, f2 列が必要です":"Columns vowel, f1, and f2 are required","Excel出力ライブラリを読み込めませんでした。CSVをご利用ください。":"The Excel export library could not be loaded. Please use CSV instead.","Excelファイルを作成できませんでした。CSVをご利用ください。":"Could not create the Excel file. Please use CSV instead.","アクセス権を確認できませんでした。":"Could not verify access permissions.","通信エラー":"Connection error","授業コードが見つかりません。":"Class code not found.","このセッションは終了しています。":"This session has ended.","教師用の認証情報を確認できません。セッションコードと再開用キーから再開してください。":"Teacher authentication could not be verified. Resume the session using the session code and recovery key.","セッションコードを発行できませんでした。もう一度お試しください。":"Could not generate a session code. Please try again.","セッションコードを発行できませんでした。":"Could not generate a session code.","セッションを再開できませんでした。":"Could not resume the session.","F1/F2データがありません。":"No F1/F2 data.","の値を確認してください。":"Check the value for ","有効なデータがありません。":"No valid data.","データを送信できませんでした。セッションが終了していないか確認してください。":"Could not submit the data. Check whether the session has ended.","完了":"Complete","未完了":"Incomplete","例語なし":"No example","まだ入力データがありません":"No input data yet","対象が選択されていません。右側の「母音・スタイル」で対象を1つ以上選択してください。":"No vowels are selected. Select at least one under “Vowels & style” on the right.","中心":"Center"});
