# サービスアカウントキーの設定方法（簡単版）

## 🔍 まず確認：既に設定されているか？

Netlifyダッシュボードで確認してください：

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. サイト `kyujin-bookmark` を選択
3. **Site settings** → **Environment variables**
4. `FIREBASE_SERVICE_ACCOUNT_KEY` が存在するか確認

**存在する場合**: ✅ 設定済みです。新しいデプロイを実行してください。

**存在しない場合**: 以下の手順で設定してください。

---

## 📝 設定手順（5分で完了）

### ステップ1: Firebase Consoleでサービスアカウントキーを生成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト **`job-seiri`** を選択
3. **設定（歯車アイコン）** → **プロジェクトの設定**
4. **「サービスアカウント」タブ**を開く
5. **「新しい秘密鍵の生成」**をクリック
6. **「キーを生成」**をクリック
7. **JSONファイルがダウンロードされます**（例：`job-seiri-xxxxx.json`）

### ステップ2: JSONファイルの内容をコピー

ダウンロードしたJSONファイルを開いて、**全体をコピー**してください。

例：
```json
{
  "type": "service_account",
  "project_id": "job-seiri",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  ...
}
```

**重要**: JSON全体をコピーしてください（改行も含む）。

### ステップ3: Netlify環境変数に設定

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. サイト **`kyujin-bookmark`** を選択
3. **Site settings** → **Environment variables**
4. **「Add a variable」**をクリック
5. 以下を入力：
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: ステップ2でコピーしたJSON全体を貼り付け
6. **「Save」**をクリック

### ステップ4: 新しいデプロイを実行

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

## 🔑 2つのキーの違い

| キー名 | 用途 | 取得場所 |
|--------|------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | クライアント側のFirebase初期化 | Firebase Console → プロジェクトの設定 → 全般 → APIキー |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | サーバー側のFirebase Admin SDK | Firebase Console → プロジェクトの設定 → サービスアカウント → 新しい秘密鍵の生成 |

**今回必要なのは `FIREBASE_SERVICE_ACCOUNT_KEY` です。**

---

## ⚠️ よくある間違い

1. **JSONファイルの一部だけをコピーする**: ❌ JSON全体をコピーしてください
2. **改行を削除する**: ❌ 改行も含めてコピーしてください
3. **JSONファイルをそのままアップロードする**: ❌ 内容をコピーして環境変数に貼り付けてください

---

## 📞 困ったときは

エラーが出る場合は、エラーメッセージを確認してください：

- `Firebase Adminが初期化されていません`: `FIREBASE_SERVICE_ACCOUNT_KEY`が設定されていない、または形式が間違っている
- `PERMISSION_DENIED`: セキュリティルールの問題（別の原因）
