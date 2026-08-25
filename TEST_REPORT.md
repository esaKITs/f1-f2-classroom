# F1–F2 Classroom v1.0.0 公開版テスト結果

実施日: 2026-08-26

## 公開判定: PASS（アプリ本体）

### 静的・構文
- JavaScript 構文: PASS
- GAS 関連参照 (`google.script.run`, `SpreadsheetApp`, `HtmlService`, `PropertiesService`, `Code.gs`): 0件
- 公開入口が小文字 `index.html`: PASS
- 画面・バックエンドの版表示 v1.0.0: PASS

### 既存のブラウザ / UI テスト
- 教師画面表示、母音設定、カスタム母音、独自セット: PASS
- 平均、楕円、値ラベル、接続線、参照データ矢印: PASS
- PNG / CSV / Excel 書き出し経路: PASS
- SVG XML妥当性、ベクター要素、transform復元: PASS
- 操作時 JavaScript runtime error: 0件

### 同期層の模擬テスト
- セッション作成 → 学生送信 → 教師取得: PASS
- 学生から他参加者IDを非表示: PASS
- 同一学生の再入力は最新版を採用: PASS
- 設定更新、教師再開、セッション終了: PASS
- 1 / 5 / 10 / 40 / 100人 × 5母音: PASS

## 実サービス側で残る確認

Firebase 本番プロジェクトの設定値はこの公開ソースには含めていません。そのため、公開サイトでの複数端末リアルタイム同期は、本番 Firebase プロジェクトへ Security Rules と Web 設定を適用後に2端末で最終確認します。

これはアプリ本体の既知不具合ではなく、外部サービスの本番設定・接続確認です。
