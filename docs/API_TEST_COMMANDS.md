# API動作確認コマンド

## ✅ 405エラーは正常です

**HTTP ERROR 405**は「Method Not Allowed」を意味します。これは、APIエンドポイントが存在しているが、GETリクエストが許可されていないことを示しています。

**これは正常な動作です**。APIはPOSTリクエストのみを受け付けるように設計されているためです。

## 🧪 実際に動作確認する方法

### 方法1: ブラウザのコンソールでテスト

1. **任意のWebページ**（例：`https://example.com`）を開く
2. **F12**を押して開発者ツールを開く
3. **Consoleタブ**を開く
4. **以下のコードをコピー＆ペーストして実行**：

```javascript
fetch('https://kyujin-bookmark.netlify.app/api/jobs/capture', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com/job/123',
    title: 'テスト求人 - 動作確認',
    content: 'これは動作確認用のテストデータです。'
  })
})
.then(response => {
  console.log('ステータス:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ 成功:', data);
})
.catch(error => {
  console.error('❌ エラー:', error);
});
```

**期待される結果**:
- ✅ **成功**: `{ success: true, id: "...", pageType: "..." }`
- ✅ **エラー（バリデーション）**: `{ error: "このページは求人詳細ページではない可能性があります。", pageType: "non_job", ... }`
- ❌ **ネットワークエラー**: CORSエラーや接続エラー

### 方法2: curlコマンドでテスト（ターミナル）

```bash
curl -X POST https://kyujin-bookmark.netlify.app/api/jobs/capture \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/job/123",
    "title": "テスト求人",
    "content": "テスト内容"
  }'
```

**期待される結果**:
- ✅ JSONレスポンスが返ってくる
- ❌ 接続エラーやタイムアウト

### 方法3: Chrome拡張機能でテスト

1. **拡張機能を読み込む**（まだの場合）:
   - `chrome://extensions/` を開く
   - 「デベロッパーモード」をON
   - 「パッケージ化されていない拡張機能を読み込む」
   - `chrome-extension` ディレクトリを選択

2. **任意のWebページ**を開く（例：`https://example.com`）

3. **拡張機能のアイコンをクリック**

4. **「この求人を保存」ボタンをクリック**

5. **結果を確認**:
   - ✅ 「保存しました!」→ 成功
   - ❌ 「エラー: ...」→ エラーメッセージを確認

6. **ブラウザのコンソール（F12）でエラーを確認**

## 🔍 エラーの種類と対処法

### エラー1: 「サーバーに接続できません」

**原因**: 
- Netlifyのデプロイが失敗している
- APIエンドポイントが存在しない
- ネットワークエラー

**確認**:
1. Netlifyダッシュボードでデプロイが成功しているか確認
2. ブラウザのコンソールでエラーメッセージを確認

### エラー2: CORSエラー

**原因**: 
- APIレスポンスにCORSヘッダーが含まれていない
- 最新のコードでは修正済みだが、デプロイされていない可能性

**対処**:
1. 最新のコードがデプロイされているか確認
2. Netlifyで新しいデプロイを実行

### エラー3: 「Firebaseが初期化されていません」

**原因**: 
- Netlify環境変数が設定されていない
- 環境変数の値が間違っている

**対処**:
1. Netlify環境変数を確認
2. 新しいデプロイを実行

### エラー4: 「このページは求人詳細ページではない可能性があります」

**原因**: 
- サーバー側の求人ページ判定ロジックが、テストページを「non_job」と判定した

**対処**:
- これは正常な動作です。実際の求人サイトでテストしてください

## 📋 動作確認の優先順位

1. **最優先**: APIエンドポイントが存在するか（405エラーが返る = 存在する ✅）
2. **次**: POSTリクエストでデータを保存できるか（ブラウザのコンソールでテスト）
3. **最後**: 拡張機能から保存できるか

## 🔗 テスト用URL

- **Webアプリ**: https://kyujin-bookmark.netlify.app
- **APIエンドポイント**: https://kyujin-bookmark.netlify.app/api/jobs/capture
- **プライバシーポリシー**: https://kyujin-bookmark.netlify.app/privacy-policy
