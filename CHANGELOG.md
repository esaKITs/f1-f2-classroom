# Changelog

## v1.1.1 — 2026-08-26
- ヘッダーに `esaKITs — Enhanced Smart AI Kits` のブランド表記を追加。
- ソース冒頭に `Copyright 2026 Tetsuya Esaki / esaKITs` と Apache License 2.0 の標準帰属表記を追加。
- v1.1.0 の多角形比較・SVG保存などの機能仕様は変更なし。

## v1.1.0 — 2026-08-26

- 多角形比較モードを追加
- 比較対象A/B：表示中平均、クラス全体平均、男性平均、女性平均、回答しない平均、強調ID、参照データ平均
- 3頂点以上は最後→最初を結び閉じた多角形、2頂点は1本の線、1頂点以下は結線なし
- 多角形A/Bの色、線種、太さ、塗り透明度を独立設定
- 頂点、母音ラベル、対応頂点線の表示とスタイル設定を追加
- 凡例に比較A/Bの対象名と線種を表示
- 平均点の塗り・輪郭線を詳細設定可能に変更
- 平均線、強調ID線、参照矢印の色・線種・太さを独立設定

## v1.0.0 — 2026-08-26

- Google Apps Script / Google Sheets 依存を完全に廃止
- 静的 Web アプリ + Firebase Realtime Database + Anonymous Authentication へ移行
- 教師所有者、12文字再開キー、学生 ID の非公開領域を実装
- 学生 ID 変更直後に最初の母音入力が消える競合を修正
- SVG保存時に F1 軸ラベルの transform が後続要素へ残る不具合を修正
- SVGダウンロード処理のブラウザ互換性を改善
- PNG / SVG / CSV / Excel 書き出し、楕円式表示、各種表示設定を公開版へ統合
- `Index.html` を GitHub Pages 用に `index.html` へ変更
- 画面上のバージョン表記を v1.0.0 に統一
