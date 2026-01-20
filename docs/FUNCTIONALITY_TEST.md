# 機能動作確認テスト

## 🧪 今すぐ確認できること

### テスト1: Webアプリが表示されるか

1. **ブラウザで開く**: `https://kyujin-bookmark.netlify.app`
2. **確認**: ログインページが表示されるか
3. **エラー確認**: ブラウザのコンソール（F12）でエラーが出ていないか

**期待される結果**: ✅ ログインページが表示される

---

### テスト2: APIエンドポイントが存在するか

**方法1: ブラウザで直接アクセス**
1. `https://kyujin-bookmark.netlify.app/api/jobs/capture` にアクセス
2. **期待される結果**: 405エラー（Method Not Allowed）が返る
   - ✅ 405エラー → APIエンドポイントは存在する
   - ❌ 404エラー → APIエンドポイントが存在しない（デプロイ失敗の可能性）

**方法2: ブラウザのコンソールでテスト**
```javascript
// ブラウザのコンソール（F12）で実行
fetch('https://kyujin-bookmark.netlify.app/api/jobs/capture', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com/test',
    title: 'テスト',
    content: 'テスト内容'
  })
})
.then(r => r.json())
.then(data => console.log('✅ API動作確認:', data))
.catch(err => console.error('❌ APIエラー:', err));
```

**期待される結果**:
- ✅ 成功: `{ success: true, id: "...", pageType: "..." }`
- ✅ エラー: `{ error: "..." }`（エラーメッセージを確認）
- ❌ ネットワークエラー: CORSエラーや接続エラー

---

### テスト3: ログイン機能が動作するか

1. `https://kyujin-bookmark.netlify.app` にアクセス
2. **アカウント作成**:
   - メールアドレスを入力
   - パスワードを入力（6文字以上）
   - 「アカウントを作成」をクリック
3. **確認**: ログインできるか、求人一覧ページが表示されるか

**期待される結果**: ✅ ログイン成功、求人一覧ページが表示される

---

### テスト4: 拡張機能から保存できるか

1. **拡張機能を読み込む**:
   - `chrome://extensions/` を開く
   - 「デベロッパーモード」をON
   - 「パッケージ化されていない拡張機能を読み込む」
   - `chrome-extension` ディレクトリを選択

2. **任意のWebページを開く**（例：`https://example.com`）

3. **拡張機能のアイコンをクリック**

4. **「この求人を保存」ボタンをクリック**

5. **結果を確認**:
   - ✅ 「保存しました!」→ 成功
   - ❌ 「エラー: ...」→ エラーメッセージを確認

6. **Webアプリで確認**:
   - `https://kyujin-bookmark.netlify.app` にアクセス
   - ログイン
   - 保存した求人が表示されるか確認

---

### テスト5: Firestoreにデータが保存されているか

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト `job-seiri` を選択
3. **Firestore Database** → **データ**タブ
4. `jobs` コレクションを確認
5. **確認**: データが保存されているか

**期待される結果**: ✅ `jobs` コレクションにデータが存在する

---

## 🔍 デバッグ方法

### ブラウザのコンソールで確認

1. **拡張機能のポップアップを開いた状態で**、F12を押す
2. **Consoleタブ**を開く
3. **確認すべきログ**:
   - `API_URL: https://kyujin-bookmark.netlify.app/api/jobs/capture`
   - `config.jsからAPI_URLを読み込み: ...` または `デフォルトのAPI_URL（本番環境）を使用: ...`
   - エラーメッセージ（赤い文字）

### Netlify Functions ログで確認

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. サイト `kyujin-bookmark` を選択
3. **Functions** → **Logs**タブ
4. **確認**: APIリクエストが来ているか、エラーが出ていないか

---

## ⚠️ よくある問題

### 問題1: 「サーバーに接続できません」

**確認事項**:
1. Netlifyのデプロイが成功しているか
2. APIエンドポイントに直接アクセスできるか
3. ブラウザのコンソールでエラーメッセージを確認

### 問題2: CORSエラー

**確認事項**:
1. APIルートのCORS設定（最新のコードでは修正済み）
2. 新しいデプロイを実行したか

### 問題3: Firebaseエラー

**確認事項**:
1. Netlify環境変数が設定されているか
2. Firestoreセキュリティルールが正しいか
3. 認証済みドメインが設定されているか

---

## 📋 最小限の動作確認チェックリスト

- [ ] Webアプリが表示される（`https://kyujin-bookmark.netlify.app`）
- [ ] APIエンドポイントが存在する（405エラーが返る）
- [ ] ログインできる
- [ ] 拡張機能のポップアップが表示される
- [ ] 拡張機能から保存できる
- [ ] Webアプリで保存した求人が表示される
