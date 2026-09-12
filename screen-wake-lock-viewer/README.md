# screen-wake-lock-viewer

## 概要

Screen Wake Lock API の基本的な挙動を、ブラウザだけで検証するためのサンプルです。
サーバや Node.js、外部ライブラリは使わず、HTML と JavaScript のみで完結します。

このサンプルで確認できること：

- 現在のブラウザが `navigator.wakeLock` に対応しているかどうか
- Wake Lock の取得（`request('screen')`）
- Wake Lock の手動解放（`release()`）
- ブラウザ側の都合（タブを閉じる・非表示にするなど）による自動解放（`release` イベント）

## ファイル構成

```
screen-wake-lock-viewer/
├── index.html   # ページ構造・UI
├── app.js       # Wake Lock 取得/解放ロジック
├── style.css    # 表示用スタイル
└── README.md    # このファイル
```

## 起動方法

Screen Wake Lock API はセキュアコンテキスト（HTTPS または localhost）でのみ動作するため、
`file://` で直接開くと動作しません。以下のいずれかの方法でローカルサーバ経由で開いてください。

### 方法1: VS Code + Live Server 拡張機能

1. VS Code にて拡張機能「Live Server」をインストール
2. `screen-wake-lock-viewer` フォルダを VS Code で開く
3. `index.html` を右クリックし「Open with Live Server」を選択
4. `http://127.0.0.1:5500/` などのURLでブラウザが開く

### 方法2: 任意のローカルサーバ

Node.js を使わない前提のため、Python が使える環境であれば以下でも代用可能です（あくまで確認用途）。

```
python3 -m http.server 8000
```

その後 `http://localhost:8000/` にアクセスします。

## 動作確認環境

- Google Chrome / Microsoft Edge（Wake Lock API対応）
- Safari（バージョンによっては非対応の場合あり）
- Firefox（デフォルトでは非対応、実験フラグが必要な場合あり）

非対応ブラウザの場合、画面上の「API対応状況」に非対応と表示され、取得ボタンが無効化されます。

## 検証できる操作・機能

| 操作                     | 内容                                                         |
|--------------------------|--------------------------------------------------------------|
| ページ読み込み時         | `navigator.wakeLock` の有無を自動チェックし、対応状況を表示  |
| 「Wake Lock を取得」ボタン | `navigator.wakeLock.request('screen')` を実行し、状態を更新  |
| 「Wake Lock を解放」ボタン | 取得中の Wake Lock を `release()` で明示的に解放              |
| タブを非表示にする       | ブラウザが自動的に Wake Lock を解放し、`release` イベントがログに記録される |

## 推奨する操作順

1. ページを開き、「API対応状況」が「対応しています」となっていることを確認する
2. 「Wake Lock を取得」ボタンを押し、状態が「取得中」になることを確認する
3. 別タブに切り替えるなどしてこのタブを非表示にし、再度戻ってきたときにログへ
   「ブラウザによって解放されました」という記録が追加されているか確認する
4. 再度取得し、「Wake Lock を解放」ボタンで手動解放できることを確認する

## DevTools での確認方法

- Console タブ: `navigator.wakeLock` の型やエラーメッセージを直接確認できます
- Application / Media タブ（Chrome DevTools の一部バージョン）: 画面ロック関連のインジケータが
  表示される場合があります（実装状況はブラウザにより異なります）
