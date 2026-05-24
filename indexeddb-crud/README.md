# indexeddb-crud

IndexedDB の CRUD 操作とトランザクションをブラウザだけで検証するサンプルコードです。

サーバ・Node.js・外部ライブラリ不要で動作します。

---

## 動作確認環境

- Chrome / Edge（最新版）
- VS Code + Live Server 拡張機能

---

## 起動方法

1. VS Code で `indexeddb-crud/` フォルダを開く
2. `index.html` を右クリック →「Open with Live Server」
3. `http://localhost:5500` 等のローカル実行でブラウザが開く

> `index.html` をダブルクリックで直接開くと `file://` のセキュリティ制限でエラーになります。必ず Live Server 等のローカル実行で開いてください。

---

## ファイル構成

```
indexeddb-crud/
├── index.html   # UI・ボタン
├── app.js       # IndexedDB の全操作ロジック
└── README.md
```

---

## 検証できる操作

| ボタン | 内容 |
|---|---|
| INSERT | 初期データ8件を投入（実行のたびに全件クリアして再投入） |
| SELECT（全件） | 保存中の全レコードを取得 |
| SELECT（インデックス検索） | `status = "todo"` のレコードを絞り込み取得 |
| UPDATE | id:1 のレコードを `status: done` に更新 |
| DELETE | id:1 のレコードを削除 |
| トランザクション（成功） | 2件を1トランザクションで追加 |
| トランザクション（失敗） | 意図的にエラーを発生させてロールバックを確認 |

---

## 推奨する操作順

```
① INSERT
② SELECT（全件 / インデックス検索）
③ UPDATE
④ DELETE
⑤ INSERT（id をリセットしたい場合）
⑥ トランザクション（成功）
⑦ トランザクション（失敗・ロールバック確認）
```

UPDATE・DELETE は id:1 を対象にしているため、INSERT より先に実行するとエラーになります。

---

## DevTools での確認方法

`F12 → Application → IndexedDB → TaskDB → tasks`

レコードの追加・更新・削除の様子をリアルタイムで確認できます。表示が古い場合は `tasks` 横の🔄ボタンで手動更新してください。

### DBをリセットしてidを1から振り直したい場合

`F12 → Application → IndexedDB → TaskDB → 右クリック →「Delete database」→ ページをリロード`

## 技術記事リンク
https://zenn.dev/shinkai_m/articles/4ddf25caef48fb
