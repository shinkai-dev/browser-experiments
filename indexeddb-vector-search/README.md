# indexeddb-vector-search

IndexedDB とコサイン類似度計算を組み合わせて、ブラウザ上だけで動作する簡易的なベクトル検索（RAG）を検証するサンプルコードです。

サーバ・Node.js・外部ライブラリ不要で動作します。

---

## 動作確認環境

- Chrome / Edge（最新版）
- VS Code + Live Server 拡張機能

---

## 起動方法

1. VS Code で `indexeddb-vector-search/` フォルダを開く
2. `index.html` を右クリック →「Open with Live Server」
3. `http://localhost:5500` 等のローカル実行でブラウザが開く

> `index.html` をダブルクリックで直接開くと `file://` のセキュリティ制限でエラーになります。必ず Live Server 等のローカル実行で開いてください。

---

## ファイル構成

```
indexeddb-vector-search/
├── index.html   # 検索インターフェース
├── app.js       # IndexedDB 操作・ベクトル生成・類似度計算ロジック
└── README.md
```

---

## 検証できる挙動

1. **初期データ投入**: ページ読み込み時に 20 件以上のサンプルテキストがベクトル化され、IndexedDB に保存されます。
2. **ベクトル検索**: 入力された検索ワードを文字カウントベースでベクトル化し、保存済みデータとのコサイン類似度を計算します。
3. **結果表示**: 類似度が高い順に最大 5 件の結果が表示されます。

---

## 技術的な詳細

- **ベクトル化**: シンプルな文字カウント方式（Bag of Characters）を採用しています。
- **検索アルゴリズム**: 保存されている全ドキュメントを読み出し、JavaScript 側でコサイン類似度を計算してソートします。
- **データ永続化**: ブラウザの IndexedDB を使用しているため、リロードしてもデータは保持されます。

## 技術記事リンク
https://zenn.dev/shinkai_m/articles/93a71ed8ea15ea
