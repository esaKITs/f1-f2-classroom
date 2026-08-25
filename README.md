# F1–F2 Classroom v1.0.0

F1–F2 Classroom は、授業参加者が各自で測定した F1 / F2 を入力し、クラス全体の母音空間を共有・比較するための Web ツールです。

## 主な機能

- 日本語5母音、米国英語の短母音6・長母音5のプリセット
- F1 / F2 のクラス集約・母音図表示
- 個々の点、平均、95%分布楕円、95%信頼楕円
- 男女別表示、入力状況確認、参加者ごとの F1 / F2 詳細表示
- 色・形・透明度・楕円・凡例・フォント・軸・グリッド・目盛の調整
- F1 / F2 値の図上ラベル表示
- クラス平均／強調IDの母音を線で接続
- 同一音素について参照データへの矢印表示
- 音素の自由追加、例語メモ、独自母音セットのブラウザ保存
- 参照データ CSV 読み込み
- PNG（高解像度）／SVG（ベクター）保存、クリップボードへの図コピー
- CSV／Excel データ書き出し
- 95%分布楕円／95%信頼楕円の式表示・コピー
- セッションコード、教師用再開キー、通信失敗時の再接続

## 構成

Google Apps Script / Google スプレッドシートは使用しません。

- 画面本体: 静的 HTML（GitHub Pages 等）
- 教師・学生間の同期: Firebase Realtime Database
- 接続認証: Firebase Anonymous Authentication
- 利用者: 教師・学生とも公開 URL を開くだけで利用
- データ書き出し: CSV / Excel を教師のブラウザから保存

学生間では参加者 ID を共有しません。母音図に必要な F1 / F2・性別・音素情報はセッション内で共有しますが、参加者 ID の対応表は教師所有者だけが読み取れる領域に分離しています。

## 管理者の初回設定

公開サイトで複数端末同期を有効にするには、サイト管理者が最初に1回だけ Firebase を設定します。

1. Firebase プロジェクトを作成
2. Authentication で匿名認証を有効化
3. Realtime Database を作成
4. `firebase-database.rules.json` を適用
5. Web アプリ設定値を `firebase-config.js` に入力
6. HTTPS の静的ホスティングへ公開

授業ごとのデプロイやスクリプト編集、Google アカウントへのログインは不要です。

`firebase-config.js` が未設定、または Firebase に接続できない場合はプレビューモードで起動します。プレビューでは画面・グラフ・設定・書き出しを確認できますが、別端末とは同期しません。

## ファイル

- `index.html` — Web アプリ画面本体
- `firebase-backend.js` — Firebase Realtime Database 接続層
- `firebase-config.js` — 公開環境の Firebase Web 設定
- `firebase-config.example.js` — 設定ひな型
- `firebase-database.rules.json` — Realtime Database Security Rules
- `reference-template.csv` — 参照データ CSV の例
- `CHANGELOG.md` — 変更履歴
- `TEST_REPORT.md` — 公開版テスト結果
- `THIRD_PARTY_NOTICES.md` — 外部ライブラリ情報

## v1.0.0

GAS依存を除去し、SVG保存不具合を修正した公開版です。公開版の画面・SVG/PNG/CSV/Excel出力、設定、模擬同期、1/5/10/40/100人規模のデータ処理を確認しています。
