# F1–F2 Classroom v1.1.1 テスト報告

実施日: 2026-08-26

## 静的検査
- PASS: JavaScript 構文チェック（Node.js）
- PASS: HTML ID 重複なし
- PASS: JavaScript のリテラル ID 参照欠落なし
- PASS: 旧 connectLineWidth 参照なし

## Chromium 操作テスト
- PASS: 教師画面・デモ40点の初期描画
- PASS: 男性平均 vs 女性平均を各5頂点で比較
- PASS: 3頂点以上でA/Bとも閉じた多角形
- PASS: 2頂点では閉じず1本の線
- PASS: A/Bの独立色設定
- PASS: 実線／破線のSVG反映
- PASS: 線幅のSVG反映
- PASS: 塗り透明度（12%）のSVG反映
- PASS: 対応する5母音の頂点対応線
- PASS: クラス全体平均 vs 参照データ平均
- PASS: 強調IDを比較対象として5母音取得
- PASS: 「表示中の平均」が性別フィルターを反映し、「クラス全体平均」と独立
- PASS: 平均点の任意塗り色
- PASS: 平均点輪郭線 OFF
- PASS: 平均点輪郭線の任意色・太さ
- PASS: 通常の平均結線を閉じた多角形として描画
- PASS: 通常の平均結線の色・破線・4px設定
- PASS: 旧設定から多角形スタイル既定値を安全に補完
- PASS: 操作中 JavaScript runtime error 0件

## SVG実保存テスト
- PASS: 「SVG保存」ボタンを実際に押してファイルをダウンロード
- PASS: 生成SVGがXML/SVGとして完結
- PASS: 多角形比較A/Bの凡例を含む
- PASS: 多角形・塗り・線種・対応線をベクター要素として保持

## 制約
このテストでは外部 CDN と Firebase 実通信を切り離したプレビューモードを使用しました。多角形比較は描画・設定・SVG出力までブラウザ実操作で確認済みです。Firebase 実ネットワーク同期部分は v1.0.0 系の通信層から変更していません。

## esaKITs ブランド回帰（v1.1.1）
- PASS: 画面ヘッダーに `esaKITs — Enhanced Smart AI Kits` を表示。
- PASS: ソース冒頭に esaKITs / Tetsuya Esaki の著作権・Apache License 2.0 帰属表記。
- PASS: 1600px・1024px幅でブランド表示とヘッダー主要操作が同じヘッダー内に収まることをChromiumで確認。
- PASS: ブランド追加後もヘッダー主要操作（参加者数・同期状態・更新）がDOM上で維持。
- PASS: v1.1.0 の多角形比較UI・SVG保存UIを維持。
