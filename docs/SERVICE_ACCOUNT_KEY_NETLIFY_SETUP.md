# Netlify環境変数への設定方法（実際の手順）

## 📋 手順

### ステップ1: JSONファイルの内容をコピー

開いている `job-seiri-firebase-adminsdk-fbsvc-a72acea818.json` ファイルの**全体**をコピーしてください。

**重要**: 
- ファイル全体をコピー（1行目から最後まで）
- 改行も含めてコピー
- `{` から `}` まで全て

### ステップ2: Netlify環境変数に設定

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. サイト **`kyujin-bookmark`** を選択
3. **Site settings** → **Environment variables**
4. **「Add a variable」**をクリック
5. 以下を入力：
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: ステップ1でコピーしたJSON全体を貼り付け
6. **「Save」**をクリック

### ステップ3: 新しいデプロイを実行

1. Netlifyダッシュボードの **「Deploys」**タブを開く
2. **「Trigger deploy」** → **「Deploy site」**をクリック
3. デプロイが完了するまで待つ（2-3分）

---

## ✅ 確認方法

デプロイ完了後、ブラウザのコンソールで以下を実行：

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
- ❌ エラー: `{ error: "Firebase Adminが初期化されていません..." }` → 環境変数の設定を再確認

---

## ⚠️ 重要な注意事項

1. **このJSONファイルは絶対にGitにコミットしないでください**
   - `.gitignore`に追加済みです
   - もし既にコミットしてしまった場合は、すぐに削除してください

2. **JSONファイルの内容をそのままコピー**
   - 改行を削除しない
   - 一部だけをコピーしない
   - JSON全体をコピー

3. **環境変数名は正確に**
   - `FIREBASE_SERVICE_ACCOUNT_KEY`（大文字小文字を正確に）
