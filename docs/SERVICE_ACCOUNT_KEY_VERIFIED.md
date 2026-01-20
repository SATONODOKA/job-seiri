# サービスアカウントキーの設定方法（確認済み）

## ✅ 正しい手順（コードに基づく）

コード（`lib/firebaseAdmin.ts`）を確認した結果、以下の手順が正しいです：

### ステップ1: Firebase Consoleでサービスアカウントキーを生成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト **`job-seiri`** を選択
3. **設定（歯車アイコン）** → **プロジェクトの設定**
4. **「サービスアカウント」タブ**を開く
5. **「新しい秘密鍵の生成」**（または「Generate new private key」）をクリック
6. **「キーを生成」**をクリック
7. **JSONファイルがダウンロードされます**

### ステップ2: JSONファイルの内容をコピー

ダウンロードしたJSONファイルを開いて、**全体をコピー**してください。

**重要**: 
- JSON全体をコピー（`{` から `}` まで）
- 改行も含めてコピー
- 例：
```json
{
  "type": "service_account",
  "project_id": "job-seiri",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  ...
}
```

### ステップ3: Netlify環境変数に設定

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. サイト **`kyujin-bookmark`** を選択
3. **Site settings** → **Environment variables**
4. **「Add a variable」**をクリック
5. 以下を入力：
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: ステップ2でコピーしたJSON全体を貼り付け
6. **「Save」**をクリック

**注意**: Netlifyの環境変数は改行を含むJSON文字列をそのまま保存できます。

### ステップ4: コードの確認

コード（`lib/firebaseAdmin.ts`）では以下のように処理されます：

```typescript
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
// ...
credential: cert(JSON.parse(serviceAccount))
```

つまり、環境変数にJSON文字列を設定し、コード内で`JSON.parse()`でパースします。

---

## ⚠️ よくある間違い

1. **JSONファイルの一部だけをコピーする**: ❌ JSON全体をコピーしてください
2. **改行を削除する**: ❌ 改行も含めてコピーしてください（Netlifyは改行を含むJSONを保存できます）
3. **個別の環境変数に分割する**: ❌ 1つの環境変数`FIREBASE_SERVICE_ACCOUNT_KEY`にJSON全体を設定してください

---

## 🔍 確認方法

デプロイ後、Netlify Functionsのログで以下が表示されれば成功です：

```
✅ Firebase Admin initialized
```

エラーが出る場合は、ログを確認してください：

- `FIREBASE_SERVICE_ACCOUNT_KEYが設定されていません`: 環境変数が設定されていない
- `Firebase Admin初期化エラー`: JSONの形式が間違っている（改行が削除されている、一部だけコピーしているなど）

---

## 📋 まとめ

**手順は正しいです。** 以下の点だけ注意してください：

1. ✅ Firebase Console → プロジェクトの設定 → サービスアカウント → 新しい秘密鍵の生成
2. ✅ JSONファイル全体をコピー（改行も含む）
3. ✅ Netlify環境変数`FIREBASE_SERVICE_ACCOUNT_KEY`にJSON全体を貼り付け
4. ✅ 新しいデプロイを実行
