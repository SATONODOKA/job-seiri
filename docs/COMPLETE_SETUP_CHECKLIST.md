# 完全設定チェックリスト - エラー要因の徹底調査

## 🔴 緊急度：高（エラーになる可能性が高い）

### 1. Firebase認証済みドメイン ✅
- [x] `kyujin-bookmark.netlify.app` が認証済みドメインに追加されている
- [ ] `localhost` も追加されている（ローカル開発用）

**確認方法**: Firebase Console → 認証 → 設定 → 承認済みドメイン

### 2. Firebase APIキーの制限設定 ✅
- [x] HTTPリファラー（ウェブサイト）の制限が設定されている
- [x] APIの制限が設定されている（Identity Toolkit API、Cloud Firestore API、Firebase Installations API）

**確認方法**: Google Cloud Console → APIとサービス → 認証情報 → APIキーを選択

### 3. Netlify環境変数（必須）

#### Firebase環境変数（6個）
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` ← **新しいAPIキーに更新済み**
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `job-seiri.firebaseapp.com`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `job-seiri`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = `job-seiri.firebasestorage.app`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = `506993669324`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` = `1:506993669324:web:693e485bcd9a546aefbe69`

#### Gemini API環境変数
- [ ] `GEMINI_API_KEY` ← **新しいAPIキーに設定済み**

**確認方法**: Netlifyダッシュボード → Site settings → Environment variables

### 4. Firestoreセキュリティルール ⚠️

**現在の状態**: 確認が必要

**推奨ルール**:
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
      // 読み取り: 認証済みユーザーは自分のデータ、またはanonymous/未設定のデータも読み取り可能
      allow read: if request.auth != null && 
                     (resource == null || 
                      resource.data.userId == request.auth.uid || 
                      resource.data.userId == "anonymous" ||
                      !('userId' in resource.data));
      
      // 作成: 認証済みユーザーは自分のuserIdで作成可能、またはanonymousで作成可能
      allow create: if request.auth != null && 
                       (request.resource.data.userId == request.auth.uid || 
                        request.resource.data.userId == "anonymous");
      
      // 更新: 認証済みユーザーは自分のデータを更新可能
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
      
      // 削除: 認証済みユーザーは自分のデータを削除可能
      allow delete: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
    }
  }
}
```

**確認方法**: Firebase Console → Firestore Database → ルールタブ

## 🟡 緊急度：中（動作に影響する可能性がある）

### 5. Firebase Admin SDK環境変数（オプション）

**現在の状態**: 設定されていない場合、警告のみ（動作は継続）

**環境変数**:
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY`（JSON形式のサービスアカウントキー）

**影響**: 設定されていない場合、IDトークン検証ができませんが、`anonymous`として動作します。

**設定方法**:
1. Firebase Console → プロジェクトの設定 → サービスアカウント
2. 「新しい秘密鍵の生成」をクリック
3. JSONファイルをダウンロード
4. JSONの内容をNetlify環境変数 `FIREBASE_SERVICE_ACCOUNT_KEY` に設定（文字列として）

### 6. EXTENSION_ID環境変数（オプション）

**現在の状態**: 設定不要（Chrome Web Store公開後に設定）

**環境変数**:
- [ ] `EXTENSION_ID` = `<Chrome拡張機能ID>`

**影響**: 設定されていない場合、CORS制限が緩和されます（開発環境では問題なし）。

**設定タイミング**: Chrome Web Store公開後に拡張機能IDを取得して設定

### 7. Netlifyデプロイ設定

**確認項目**:
- [ ] `netlify.toml` が正しく設定されている
- [ ] `@netlify/plugin-nextjs` がインストールされている
- [ ] ビルドコマンドが `npm run build` になっている

**確認方法**: Netlifyダッシュボード → Site settings → Build & deploy

## 🟢 緊急度：低（ローカル開発用）

### 8. Chrome拡張機能のconfig.js

**現在の状態**: ローカル開発用のみ必要

**ファイル**: `chrome-extension/config.js`（`.gitignore`に含まれている）

**設定内容**:
```javascript
const FIREBASE_CONFIG = {
  apiKey: "<Firebase APIキー>",
  authDomain: "job-seiri.firebaseapp.com",
  projectId: "job-seiri",
  storageBucket: "job-seiri.firebasestorage.app",
  messagingSenderId: "506993669324",
  appId: "1:506993669324:web:693e485bcd9a546aefbe69"
};

const API_URL = "https://kyujin-bookmark.netlify.app/api/jobs/capture";
```

**設定方法**: `chrome-extension/config.example.js` をコピーして `config.js` を作成

## 🔍 エラーになりそうな要因の詳細

### A. 環境変数のタイポ

**よくある間違い**:
- `NEXT_PUBLIC_FIREBASE_API_KEY` → `NEXT_PUBLIC_FIREBASE_APIKEY`（間違い）
- `GEMINI_API_KEY` → `GEMINI_APIKEY`（間違い）

**確認方法**: Netlify環境変数一覧で正確な変数名を確認

### B. 環境変数の値の間違い

**よくある間違い**:
- Firebase APIキーの値に余分なスペースが含まれている
- 値が空文字列になっている
- 値が `undefined` になっている

**確認方法**: Netlify環境変数の値をコピー＆ペーストして確認

### C. デプロイが実行されていない

**問題**: 環境変数を追加・更新した後、デプロイを実行していない

**対処**: Netlifyダッシュボード → Deploys → 「Trigger deploy」→ 「Deploy site」

### D. Firestoreセキュリティルールの不一致

**問題**: セキュリティルールが厳しすぎて、認証済みユーザーでもデータを読み取れない

**対処**: 上記の推奨ルールを適用

### E. CORS設定の問題

**問題**: `EXTENSION_ID` が設定されていない場合、CORS制限が緩和される（開発環境では問題なし）

**対処**: Chrome Web Store公開後に拡張機能IDを取得して設定

### F. Firebase Admin SDKの設定不足

**問題**: `FIREBASE_SERVICE_ACCOUNT_KEY` が設定されていない場合、IDトークン検証ができない

**影響**: `anonymous`として動作するため、動作自体は継続しますが、ユーザー識別ができません

**対処**: 必要に応じて設定（オプション）

## 📋 完全チェックリスト

### Firebase設定
- [ ] Firebase認証済みドメインに `kyujin-bookmark.netlify.app` が追加されている
- [ ] Firebase APIキーの制限設定が完了している
- [ ] Firestoreセキュリティルールが正しく設定されている

### Netlify環境変数（必須）
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`（新しいAPIキー）
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `job-seiri.firebaseapp.com`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `job-seiri`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = `job-seiri.firebasestorage.app`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = `506993669324`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` = `1:506993669324:web:693e485bcd9a546aefbe69`
- [ ] `GEMINI_API_KEY`（新しいAPIキー）

### Netlify環境変数（オプション）
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY`（Firebase Admin SDK用、オプション）
- [ ] `EXTENSION_ID`（Chrome Web Store公開後に設定）

### デプロイ
- [ ] 環境変数を追加・更新した後、新しいデプロイを実行した
- [ ] デプロイが成功している

### 動作確認
- [ ] Webアプリでログインできる
- [ ] Firestoreにデータを保存できる
- [ ] 拡張機能からデータを保存できる
- [ ] エラーが出ていない

## 🔗 関連ドキュメント

- [Firebase設定ガイド](./FIREBASE_SETUP_GUIDE.md)
- [Firebase APIキーの場所](./FIREBASE_API_KEY_LOCATION_V2.md)
- [Firebase APIキーの制限設定](./FIREBASE_API_KEY_RESTRICTIONS_FIXED.md)
- [Netlify環境変数設定](./NETLIFY_API_KEY_SETUP.md)
- [Firestoreセキュリティルール](./FIRESTORE_RULES_FIX.md)
