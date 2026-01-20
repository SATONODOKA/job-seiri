# 動作確認チェックリスト - 機能が動いているか確認

## 🔍 基本的な動作確認

### 1. Webアプリの動作確認

#### 1-1. ページが表示されるか
1. `https://kyujin-bookmark.netlify.app` にアクセス
2. ログインページが表示されるか確認
3. エラーが出ていないか確認（ブラウザのコンソールで確認）

#### 1-2. ログイン機能
1. アカウントを作成（メールアドレス + パスワード）
2. ログインできるか確認
3. ログイン後、求人一覧ページが表示されるか確認

#### 1-3. Firestore接続確認
1. ログイン後、求人一覧が表示されるか確認
2. ブラウザのコンソール（F12）でエラーが出ていないか確認
3. エラーが出ている場合、Firestoreセキュリティルールを確認

### 2. APIエンドポイントの動作確認

#### 2-1. APIエンドポイントが存在するか
1. `https://kyujin-bookmark.netlify.app/api/jobs/capture` にアクセス
2. 405エラー（Method Not Allowed）が返ることを確認（GETは許可されていないため）
3. 404エラー（Not Found）が返る場合は、デプロイが失敗している可能性

#### 2-2. OPTIONSリクエスト（CORS確認）
ブラウザのコンソールで以下を実行：
```javascript
fetch('https://kyujin-bookmark.netlify.app/api/jobs/capture', {
  method: 'OPTIONS'
}).then(r => {
  console.log('OPTIONS Status:', r.status);
  console.log('CORS Headers:', {
    'Access-Control-Allow-Origin': r.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': r.headers.get('Access-Control-Allow-Methods')
  });
});
```

**期待される結果**:
- Status: 200
- Access-Control-Allow-Origin: `*` または `chrome-extension://...`

#### 2-3. POSTリクエスト（実際の保存）
ブラウザのコンソールで以下を実行：
```javascript
fetch('https://kyujin-bookmark.netlify.app/api/jobs/capture', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com/job/123',
    title: 'テスト求人',
    content: 'これはテストです'
  })
}).then(r => r.json()).then(data => {
  console.log('Response:', data);
}).catch(err => {
  console.error('Error:', err);
});
```

**期待される結果**:
- 成功時: `{ success: true, id: "...", pageType: "..." }`
- エラー時: `{ error: "..." }`（エラーメッセージを確認）

### 3. Chrome拡張機能の動作確認

#### 3-1. 拡張機能が読み込まれているか
1. `chrome://extensions/` を開く
2. 「デベロッパーモード」がONになっているか確認
3. 「求人ブックマーク」拡張機能が表示されているか確認
4. エラーが出ていないか確認

#### 3-2. 拡張機能のポップアップが開くか
1. 任意のWebページ（例：`https://example.com`）を開く
2. 拡張機能のアイコンをクリック
3. ポップアップが表示されるか確認
4. 「この求人を保存」ボタンが表示されるか確認

#### 3-3. 実際に保存してみる
1. 求人サイト（例：SmartHR、Sansan等）の求人詳細ページを開く
2. 拡張機能のアイコンをクリック
3. 「この求人を保存」ボタンをクリック
4. ステータスメッセージを確認：
   - ✅ 「保存しました!」→ 成功
   - ❌ 「エラー: ...」→ エラーメッセージを確認

#### 3-4. ブラウザのコンソールで確認
1. 拡張機能のポップアップを開いた状態で、F12を押す
2. Consoleタブを開く
3. 以下のログを確認：
   - `API_URL: https://kyujin-bookmark.netlify.app/api/jobs/capture`
   - `config.jsからAPI_URLを読み込み: ...` または `デフォルトのAPI_URL（本番環境）を使用: ...`
4. エラーが出ていないか確認

### 4. Firebase設定の確認

#### 4-1. Firestoreセキュリティルール
1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト `job-seiri` を選択
3. Firestore Database → ルールタブ
4. ルールが正しく設定されているか確認

#### 4-2. 認証済みドメイン
1. Firebase Console → 認証 → 設定タブ
2. 「承認済みドメイン」に以下が含まれているか確認：
   - `kyujin-bookmark.netlify.app`
   - `localhost`（ローカル開発用）

### 5. Netlify環境変数の確認

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. サイト `kyujin-bookmark` を選択
3. Site settings → Environment variables
4. 以下の環境変数が設定されているか確認：
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `GEMINI_API_KEY`

### 6. デプロイ状態の確認

1. Netlifyダッシュボード → Deploysタブ
2. 最新のデプロイが成功しているか確認
3. 失敗している場合、ビルドログを確認

## 🐛 よくある問題と対処法

### 問題1: 「サーバーに接続できません」

**原因**:
- APIエンドポイントが存在しない
- CORS設定が間違っている
- Netlifyのデプロイが失敗している

**対処**:
1. Netlifyのデプロイが成功しているか確認
2. APIエンドポイントに直接アクセスして確認
3. ブラウザのコンソールでエラーメッセージを確認

### 問題2: 「Firebaseが初期化されていません」

**原因**:
- 環境変数が設定されていない
- 環境変数の値が間違っている

**対処**:
1. Netlify環境変数を確認
2. 新しいデプロイを実行

### 問題3: 「Missing or insufficient permissions」

**原因**:
- Firestoreセキュリティルールが厳しすぎる
- 認証済みドメインが設定されていない

**対処**:
1. Firestoreセキュリティルールを確認
2. 認証済みドメインを確認

### 問題4: CORSエラー

**原因**:
- APIレスポンスにCORSヘッダーが含まれていない
- `EXTENSION_ID`が設定されていない場合、`*`が許可されるはず

**対処**:
1. APIルートのCORS設定を確認（最新のコードでは修正済み）
2. 新しいデプロイを実行

## 📋 動作確認チェックリスト

### Webアプリ
- [ ] ログインページが表示される
- [ ] アカウントを作成できる
- [ ] ログインできる
- [ ] 求人一覧が表示される（空でもOK）

### APIエンドポイント
- [ ] OPTIONSリクエストが成功する（200）
- [ ] CORSヘッダーが返ってくる
- [ ] POSTリクエストでデータを保存できる

### Chrome拡張機能
- [ ] 拡張機能が読み込まれている
- [ ] ポップアップが表示される
- [ ] 「この求人を保存」ボタンが表示される
- [ ] ボタンをクリックして保存できる
- [ ] エラーメッセージが出ない

### Firebase設定
- [ ] Firestoreセキュリティルールが設定されている
- [ ] 認証済みドメインが設定されている
- [ ] 環境変数が設定されている

## 🔗 確認用URL

- Webアプリ: https://kyujin-bookmark.netlify.app
- APIエンドポイント: https://kyujin-bookmark.netlify.app/api/jobs/capture
- プライバシーポリシー: https://kyujin-bookmark.netlify.app/privacy-policy
- サポート: https://kyujin-bookmark.netlify.app/support
