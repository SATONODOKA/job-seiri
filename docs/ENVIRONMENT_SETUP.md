# 環境変数設定ガイド

## 概要

このサービスを動作させるために必要な環境変数の設定方法を説明します。

## 必要な環境変数

### Firebase環境変数（必須）

以下の6つの環境変数が必須です：

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

**設定されていない場合の動作**:
- Firebase初期化が失敗し、データ保存ができません
- APIルートが500エラーを返します

### Gemini API環境変数（LLM機能を使用する場合）

```
GEMINI_API_KEY
```

**設定されていない場合の動作**:
- LLM機能は無効化されます
- 空の`ExtractedJobData`が返されます（すべてのフィールドが`null`）
- 警告ログが出力されますが、サービスは動作します

## 設定方法

### ローカル開発環境

`.env.local`ファイルを作成し、以下を設定：

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API (オプション)
GEMINI_API_KEY=your_gemini_api_key
```

### Netlify環境

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. サイトを選択
3. **サイト設定 → Environment variables → 変数を追加**
4. 各環境変数を個別に追加

**重要**: 
- 環境変数を追加・変更した後は、**新しいデプロイが必要**です
- 「Retry deploy」をクリックするか、新しいコミットをプッシュしてください

## 動作確認

### ローカル環境

```bash
npm run dev
```

サーバーログで以下を確認：
- `[LLM] API_KEY存在確認: true/false`
- `Firebase初期化エラー` が表示されないこと

### Netlify環境

Netlifyダッシュボード → Functions → Logs で以下を確認：
- `[LLM] extractWithGemini 開始` が表示されること
- `Firebase初期化エラー` が表示されないこと

## トラブルシューティング

### Firebase初期化エラー

**症状**: `Firebase初期化エラー: db is null` が表示される

**対処**:
1. すべてのFirebase環境変数が設定されているか確認
2. 変数名が正確か確認（`NEXT_PUBLIC_`プレフィックス必須）
3. 値に引用符が含まれていないか確認
4. Netlifyの場合、新しいデプロイを実行

### LLM機能が動作しない

**症状**: `[LLM] API_KEY存在確認: false` が表示される

**対処**:
1. `GEMINI_API_KEY`が設定されているか確認
2. APIキーが正しいか確認
3. Netlifyの場合、新しいデプロイを実行

### 環境変数が反映されない

**対処**:
1. サーバーを再起動（ローカル環境）
2. 新しいデプロイを実行（Netlify環境）
3. ブラウザのキャッシュをクリア
