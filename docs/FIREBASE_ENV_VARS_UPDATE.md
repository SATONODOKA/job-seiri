# Firebase環境変数の更新ガイド

## 🔍 現状確認

Netlifyに設定されているFirebase環境変数：
- `NEXT_PUBLIC_FIREBASE_API_KEY` ← **これだけ更新が必要**
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` ← 変更不要
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` ← 変更不要
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` ← 変更不要
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` ← 変更不要
- `NEXT_PUBLIC_FIREBASE_APP_ID` ← 変更不要

## ✅ 更新が必要なもの

### 1. Firebase APIキー（`NEXT_PUBLIC_FIREBASE_API_KEY`）

**理由**: 古いAPIキーがGitHubに漏洩したため、新しいAPIキーに更新する必要があります。

**手順**:
1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト `job-seiri` を選択
3. **設定（歯車アイコン）→ プロジェクトの設定**
4. **「APIキー」タブ**を開く
5. 漏洩したAPIキー `AIzaSyDg3-q0Hn-GBitx3NscOp6hQ9Fw3LWfRzw` を無効化または削除
6. **「APIキーを作成」**をクリックして新しいAPIキーを生成
7. 新しいAPIキーをコピー
8. Netlify環境変数 `NEXT_PUBLIC_FIREBASE_API_KEY` を新しい値に更新

## ❌ 更新不要なもの

以下の設定値は**変更不要**です。これらはFirebaseプロジェクトの固定値で、漏洩のリスクはありません。

### 2. Firebase Auth Domain（`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`）
```
job-seiri.firebaseapp.com
```
- Firebaseプロジェクトの固定ドメイン
- 変更不要

### 3. Firebase Project ID（`NEXT_PUBLIC_FIREBASE_PROJECT_ID`）
```
job-seiri
```
- FirebaseプロジェクトのID
- 変更不要（変更すると既存データにアクセスできなくなる）

### 4. Firebase Storage Bucket（`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`）
```
job-seiri.firebasestorage.app
```
- Firebase Storageのバケット名
- 変更不要

### 5. Firebase Messaging Sender ID（`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`）
```
506993669324
```
- Firebase Cloud Messagingの送信者ID
- 変更不要

### 6. Firebase App ID（`NEXT_PUBLIC_FIREBASE_APP_ID`）
```
1:506993669324:web:693e485bcd9a546aefbe69
```
- FirebaseアプリのID
- 変更不要

## 🔐 Firestore関連の設定

### Firestoreセキュリティルール

Firestoreのセキュリティルールは既に更新済みです。変更不要です。

現在のルールは `docs/FIREBASE_SETUP_GUIDE.md` に記載されています。

### Firestoreデータベース

Firestoreデータベース自体は変更不要です。既存のデータはそのまま使用できます。

## 📋 Netlify環境変数の更新手順

### 1. Firebase APIキーの更新

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. サイト `kyujin-bookmark` を選択
3. **サイト設定 → Environment variables** を開く
4. `NEXT_PUBLIC_FIREBASE_API_KEY` を探す
5. **「Edit」**をクリック
6. 新しいAPIキーを入力
7. **「Save」**をクリック

### 2. デプロイの実行

**重要**: 環境変数を更新した後、必ず新しいデプロイを実行してください。

1. Netlifyダッシュボード → **Deploys** タブ
2. **「Trigger deploy」** → **「Deploy site」** をクリック
3. または、新しいコミットをプッシュ

### 3. 動作確認

1. デプロイが完了したら、Webアプリにアクセス
2. ログインできることを確認
3. Firestoreにデータが保存できることを確認
4. ブラウザのコンソール（F12）でエラーが出ていないか確認

## ⚠️ 注意事項

1. **APIキーのみ更新**: 他のFirebase設定値は変更しないでください
2. **既存データ**: Firestoreの既存データはそのまま使用できます
3. **認証済みドメイン**: `kyujin-bookmark.netlify.app` が認証済みドメインに追加されているか確認してください（`docs/FIREBASE_SETUP_GUIDE.md` 参照）

## 🔗 関連ドキュメント

- [Firebase設定ガイド](./FIREBASE_SETUP_GUIDE.md)
- [Gemini APIキー設定ガイド](./GEMINI_API_KEY_SETUP.md)
