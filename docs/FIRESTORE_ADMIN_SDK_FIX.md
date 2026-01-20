# Firestore Admin SDK修正 - PERMISSION_DENIEDエラーの解決

## 🔴 問題

**エラー**: `7 PERMISSION_DENIED: Missing or insufficient permissions.`

## 🔍 原因

APIルート（`app/api/jobs/capture/route.ts`）はサーバーサイドで実行されていますが、クライアントサイドのFirestore SDK（`firebase/firestore`）を使っていたため、Firestoreのセキュリティルールの制約を受けていました。

サーバーサイドでは認証情報（`request.auth`）が存在しないため、セキュリティルールで`request.auth != null`をチェックしていると、常に失敗します。

## ✅ 解決策

Firestore Admin SDKを使用するように変更しました。Admin SDKはセキュリティルールをバイパスするため、サーバーサイドからの書き込みが可能です。

### 変更内容

1. **`lib/firebaseAdmin.ts`**: Firestore Admin SDKのインスタンスをエクスポート
2. **`app/api/jobs/capture/route.ts`**: クライアントSDKからAdmin SDKに変更
3. **`lib/rateLimit.ts`**: Admin SDKを使用するように変更

### 必要な環境変数

**必須**: `FIREBASE_SERVICE_ACCOUNT_KEY`

この環境変数は、Firebase Admin SDKを初期化するために必要です。

**設定方法**:
1. Firebase Console → プロジェクトの設定 → サービスアカウント
2. 「新しい秘密鍵の生成」をクリック
3. JSONファイルをダウンロード
4. JSONの内容をNetlify環境変数 `FIREBASE_SERVICE_ACCOUNT_KEY` に設定（文字列として）

**注意**: JSONファイルは改行を含むため、Netlify環境変数に設定する際は、JSON全体を文字列として設定してください。

## 📋 動作確認

### 1. 環境変数の確認

Netlifyダッシュボードで `FIREBASE_SERVICE_ACCOUNT_KEY` が設定されているか確認してください。

### 2. APIエンドポイントのテスト

ブラウザのコンソールで以下を実行：

```javascript
fetch('https://kyujin-bookmark.netlify.app/api/jobs/capture', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com/job/123',
    title: 'テスト求人',
    content: 'テスト内容'
  })
})
.then(r => r.json())
.then(data => console.log('✅ 結果:', data))
.catch(err => console.error('❌ エラー:', err));
```

**期待される結果**:
- ✅ 成功: `{ success: true, id: "...", pageType: "..." }`
- ❌ エラー: `{ error: "Firebase Adminが初期化されていません..." }` → `FIREBASE_SERVICE_ACCOUNT_KEY`が設定されていない

### 3. 拡張機能からのテスト

1. 拡張機能のアイコンをクリック
2. 「この求人を保存」ボタンをクリック
3. エラーが出ないことを確認

## 🔗 関連ドキュメント

- `docs/FIREBASE_SETUP_GUIDE.md`: Firebase設定の詳細ガイド
- `docs/COMPLETE_SETUP_CHECKLIST.md`: 完全な設定チェックリスト
