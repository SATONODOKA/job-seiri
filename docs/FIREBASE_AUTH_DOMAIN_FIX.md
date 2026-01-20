# Firebase認証エラー解決ガイド

## 🔴 エラー内容

```
Firebase: Error (auth/requests-from-referer-https://kyujin-bookmark.netlify.app-are-blocked.)
エラーコード: auth/requests-from-referer-https://kyujin-bookmark.netlify.app-are-blocked.
```

## 📋 原因

Firebaseの認証済みドメインリストに `kyujin-bookmark.netlify.app` が追加されていないため、Firebase Authenticationがこのドメインからのリクエストをブロックしています。

## ✅ 解決手順（5分で完了）

### ステップ1: Firebase Consoleにアクセス

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. ログイン（Googleアカウントで）

### ステップ2: プロジェクトを選択

1. プロジェクト一覧から **`job-seiri`** を選択
2. プロジェクトダッシュボードが表示されます

### ステップ3: 認証設定を開く

1. 左側のメニューから **「認証（Authentication）」** をクリック
2. 上部のタブから **「設定」** タブをクリック

### ステップ4: 認証済みドメインを追加

1. **「承認済みドメイン」** セクションを探す
2. 現在のドメイン一覧を確認：
   - `localhost` （開発用）
   - `job-seiri.firebaseapp.com` （Firebaseデフォルト）
3. **「ドメインを追加」** ボタンをクリック
4. 以下のドメインを入力：
   ```
   kyujin-bookmark.netlify.app
   ```
5. **「追加」** ボタンをクリック

### ステップ5: 確認

追加後、認証済みドメイン一覧に以下が表示されていることを確認：

- ✅ `localhost`
- ✅ `job-seiri.firebaseapp.com`
- ✅ `kyujin-bookmark.netlify.app` ← **新規追加**

## 🧪 動作確認

1. ブラウザで `https://kyujin-bookmark.netlify.app` にアクセス
2. ログインページが表示されることを確認
3. アカウントを作成またはログインを試す
4. エラーが出ないことを確認

## ⚠️ 注意事項

- ドメインを追加した後、**数秒〜1分程度**で反映されます
- ブラウザのキャッシュをクリアする必要はありません（Firebase側の設定変更のため）
- エラーが続く場合は、ブラウザをリロード（F5）してみてください

## 🔗 参考リンク

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Authentication ドキュメント](https://firebase.google.com/docs/auth)

## 📸 スクリーンショットの場所（参考）

Firebase Consoleでの設定場所：
```
Firebase Console
  → プロジェクト「job-seiri」を選択
    → 左メニュー「認証（Authentication）」
      → 上部タブ「設定」
        → 「承認済みドメイン」セクション
          → 「ドメインを追加」ボタン
```
