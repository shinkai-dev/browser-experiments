# indexeddb-form-autosave

IndexedDB を利用して、フォームの入力内容をリアルタイムで自動保存（下書き保存）するサンプルコードです。

サーバ・Node.js・外部ライブラリ不要で動作します。

---

## 動作確認環境

- Chrome / Edge（最新版）
- VS Code + Live Server 拡張機能

---

## 起動方法

1. VS Code で `indexeddb-form-autosave/` フォルダを開く
2. `index.html` を右クリック →「Open with Live Server」
3. `http://localhost:5500` 等のローカル実行でブラウザが開く

> `index.html` をダブルクリックで直接開くと `file://` のセキュリティ制限でエラーになります。必ず Live Server 等のローカル実行で開いてください。

---

## ファイル構成

```
indexeddb-form-autosave/
├── index.html           # フォーム UI
├── index-extended.html  # 複雑な入力項目を含むフォーム UI
├── app.js               # フォーム操作・IndexedDB 自動保存ロジック
└── README.md
```

---

## 検証できる操作

1. **自動保存**: フォームに入力を開始すると、`input` イベントを検知して IndexedDB に即座に保存されます。
2. **下書き復元**: ページをリロードしたり、一度タブを閉じてから再度開いたりした際に、前回入力した内容が自動的に復元されます。
3. **データ削除**: 「送信」ボタンを押すと、申請完了として保存されていた下書きデータが IndexedDB から削除されます。

---

## 技術的な詳細

- **保存対象**: `input`（text, checkbox, radio など）、`textarea`、`select` 要素が対象です（パスワードやボタン類は除外）。
- **データ構造**: フォーム全体の値を一つのオブジェクトとして IndexedDB に保存しています。
- **イベントループ**: 入力のたびに非同期で IndexedDB への `put` 操作が行われます。

---

## DevTools での確認方法

`F12 → Application → IndexedDB → DraftDB → drafts`

入力のたびに `fields` オブジェクトの中身が更新される様子をリアルタイムで確認できます。

### 下書きを強制的に消去したい場合

`F12 → Application → IndexedDB → DraftDB → 右クリック →「Delete database」→ ページをリロード`

## 技術記事リンク
https://zenn.dev/shinkai_m/articles/2ca451747e04b7
