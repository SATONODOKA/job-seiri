# 拡張機能のconfig.js修正ガイド

## 🔴 問題

拡張機能で「開発サーバーに接続できません」というエラーが発生しています。

## 📋 原因

`chrome-extension/config.js`ファイルの中の`API_URL`が古いURL（`https://job-seiri.netlify.app`）になっているためです。

## ✅ 解決方法

### 方法1: config.jsを修正する（推奨）

1. `chrome-extension/config.js`ファイルを開く
2. 15行目の`API_URL`を以下のように変更：

**変更前**:
```javascript
const API_URL = "https://job-seiri.netlify.app/api/jobs/capture";
```

**変更後**:
```javascript
const API_URL = "https://kyujin-bookmark.netlify.app/api/jobs/capture";
```

3. ファイルを保存
4. Chrome拡張機能を再読み込み（`chrome://extensions/` → 拡張機能の「再読み込み」ボタン）

### 方法2: config.jsを削除する

`config.js`が不要な場合（デフォルトの本番URLを使用する場合）：

1. `chrome-extension/config.js`ファイルを削除
2. Chrome拡張機能を再読み込み

**注意**: `config.js`を削除すると、`popup.js`のデフォルトURL（`https://kyujin-bookmark.netlify.app/api/jobs/capture`）が使用されます。

## 🔍 確認方法

1. Chrome拡張機能のポップアップを開く
2. ブラウザの開発者ツール（F12）を開く
3. Consoleタブを確認
4. 「config.jsからAPI_URLを読み込み:」または「デフォルトのAPI_URL（本番環境）を使用:」というログを確認
5. URLが`https://kyujin-bookmark.netlify.app/api/jobs/capture`になっていることを確認

## 📝 現在のconfig.jsの内容

現在の`config.js`ファイル（15行目）:
```javascript
const API_URL = "https://job-seiri.netlify.app/api/jobs/capture"; // ← 古いURL
```

修正後:
```javascript
const API_URL = "https://kyujin-bookmark.netlify.app/api/jobs/capture"; // ← 新しいURL
```

## ⚠️ 注意事項

- `config.js`は`.gitignore`に含まれているため、Gitにコミットされません
- ローカル環境でのみ修正が必要です
- 他の開発者が同じ問題に遭遇した場合、各自で修正する必要があります
