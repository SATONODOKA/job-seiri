# Gemini APIキー設定ガイド

## ⚠️ 重要: セキュリティ

**このドキュメントには実際のAPIキーを記載しないでください。**
APIキーはNetlifyの環境変数として設定し、コードやドキュメントには含めないでください。

---

## Netlify環境変数の設定手順

### 1. Netlifyダッシュボードにアクセス

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. サイト `kyujin-bookmark` を選択
3. **サイト設定 → Environment variables** を開く

### 2. Gemini APIキーを設定

1. **「Add a variable」** をクリック
2. 以下の情報を入力：
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `<新しいGemini APIキー>`（実際のAPIキーを入力）
3. **「Save」** をクリック

### 3. デプロイの実行

**重要**: 環境変数を追加した後、必ず新しいデプロイを実行してください。

1. Netlifyダッシュボード → **Deploys** タブ
2. **「Trigger deploy」** → **「Deploy site」** をクリック
3. または、新しいコミットをプッシュ

### 4. 動作確認

1. デプロイが完了したら、Webアプリにアクセス
2. 拡張機能から求人を保存してみる
3. ブラウザのコンソール（F12）でエラーが出ていないか確認
4. Netlify Functions のログを確認：
   - Netlifyダッシュボード → Functions → Logs
   - `GEMINI_API_KEY が設定されていません` という警告が出ていないか確認

---

## ローカル開発環境での設定（オプション）

ローカルで開発する場合のみ、`.env.local` ファイルを作成してください。

**注意**: `.env.local` は `.gitignore` に含まれているため、Gitにコミットされません。

### `.env.local` の作成

プロジェクトルートに `.env.local` ファイルを作成し、以下を追加：

```
GEMINI_API_KEY=<新しいGemini APIキー>
```

### ローカル開発サーバーの起動

```bash
npm run dev
```

---

## 確認事項

- [ ] Netlify環境変数に `GEMINI_API_KEY` が設定されている
- [ ] 環境変数追加後に新しいデプロイを実行した
- [ ] デプロイが成功している
- [ ] 拡張機能から求人を保存できる
- [ ] Netlify Functions のログにエラーが出ていない

---

## トラブルシューティング

### エラー: "Gemini APIが初期化されていません"

**原因**: `GEMINI_API_KEY` 環境変数が設定されていない、またはデプロイされていない

**対処**:
1. Netlify環境変数を確認
2. 新しいデプロイを実行
3. Netlify Functions のログを確認

### エラー: "API key not valid"

**原因**: APIキーが無効または間違っている

**対処**:
1. Google Cloud ConsoleでAPIキーが有効か確認
2. APIキーにGemini APIが有効になっているか確認
3. 正しいAPIキーをNetlify環境変数に設定

---

## 参考リンク

- [Netlify環境変数の設定](https://docs.netlify.com/environment-variables/overview/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Gemini API ドキュメント](https://ai.google.dev/docs)
