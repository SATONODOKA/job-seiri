# Firebase設定ガイド

## 🔴 緊急対応: APIキー漏洩の対処

**重要**: このドキュメントに含まれていたAPIキーは既にGitHubに公開されています。以下の手順で無効化・再生成を行ってください。

### 1. 漏洩したAPIキーの無効化

#### Firebase APIキーの無効化
1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト `job-seiri` を選択
3. **設定（歯車アイコン）→ プロジェクトの設定**
4. **「APIキー」タブ**を開く
5. 漏洩したAPIキー `AIzaSyDg3-q0Hn-GBitx3NscOp6hQ9Fw3LWfRzw` を探す
6. **「削除」または「制限を追加」**をクリック
7. 新しいAPIキーを生成（必要に応じて）

#### Gemini APIキーの無効化
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクト `gen-lang-client-0319087094` (Gemini Project) を選択
3. **APIとサービス → 認証情報**
4. 漏洩したAPIキー `AIzaSyBAkiikASl6L4gGwmGdoNk7IPw21w3xZF8` を探す
5. **「削除」または「制限を追加」**をクリック
6. 新しいAPIキーを生成（必要に応じて）

---

## Firebase認証済みドメインの設定

### 問題
新しいドメイン `kyujin-bookmark.netlify.app` がFirebaseの認証済みドメインリストに追加されていないため、認証エラーが発生しています。

### 解決手順

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト `job-seiri` を選択
3. **認証（Authentication）** → **設定**タブ
4. **「承認済みドメイン」**セクションを確認
5. **「ドメインを追加」**をクリック
6. 以下のドメインを追加：
   ```
   kyujin-bookmark.netlify.app
   ```
7. **「追加」**をクリック

### 確認事項
- ✅ `localhost` (開発用)
- ✅ `job-seiri.firebaseapp.com` (Firebaseデフォルト)
- ✅ `kyujin-bookmark.netlify.app` (新規追加)

---

## Firestoreセキュリティルールの確認

### 現在の設定（推奨）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // rate_limits コレクション（レート制限用）
    match /rate_limits/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // jobs コレクション（求人データ）
    match /jobs/{jobId} {
      // 認証済みユーザーは自分のデータを読み書き可能
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
      
      // anonymous または userId が null のデータも読み書き可能（後方互換性）
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == 'anonymous' || !('userId' in resource.data));
    }
  }
}
```

### 設定手順

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト `job-seiri` を選択
3. **Firestore Database** → **ルール**タブ
4. 上記のルールをコピー＆ペースト
5. **「公開」**をクリック

---

## 環境変数の設定

### Netlify環境変数

**重要**: 実際のAPIキーは環境変数として設定してください。ドキュメントには含めないでください。

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. サイトを選択
3. **サイト設定 → Environment variables → 変数を追加**

#### Firebase環境変数（必須・6個）
```
NEXT_PUBLIC_FIREBASE_API_KEY=<実際のAPIキー>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=job-seiri.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=job-seiri
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=job-seiri.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=506993669324
NEXT_PUBLIC_FIREBASE_APP_ID=1:506993669324:web:693e485bcd9a546aefbe69
```

#### Gemini API環境変数（LLM機能を使用する場合）
```
GEMINI_API_KEY=<実際のAPIキー>
```

#### Firebase Admin SDK環境変数（サーバーサイド認証用）
```
FIREBASE_ADMIN_PROJECT_ID=job-seiri
FIREBASE_ADMIN_CLIENT_EMAIL=<サービスアカウントのメールアドレス>
FIREBASE_ADMIN_PRIVATE_KEY=<サービスアカウントの秘密鍵>
```

**⚠️ 重要**: 
- 環境変数を追加した後、**必ず新しいデプロイを実行**
- Netlifyダッシュボード → Deploys → 「Trigger deploy」→ 「Deploy site」
- または、新しいコミットをプッシュ

---

## チェックリスト

### 緊急対応
- [ ] 漏洩したFirebase APIキーを無効化
- [ ] 漏洩したGemini APIキーを無効化
- [ ] 新しいAPIキーを生成（必要に応じて）
- [ ] Netlify環境変数を更新

### Firebase設定
- [ ] `kyujin-bookmark.netlify.app` を認証済みドメインに追加
- [ ] Firestoreセキュリティルールを確認・更新
- [ ] Firebase Admin SDKのサービスアカウントを作成（未作成の場合）

### 動作確認
- [ ] Webアプリでログインできることを確認
- [ ] 拡張機能からデータを保存できることを確認
- [ ] Firestoreにデータが正しく保存されることを確認

---

## 参考リンク

- [Firebase Console](https://console.firebase.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Netlifyダッシュボード](https://app.netlify.com/)
- [Firebase Authentication ドキュメント](https://firebase.google.com/docs/auth)
- [Firestore セキュリティルール ドキュメント](https://firebase.google.com/docs/firestore/security/get-started)
