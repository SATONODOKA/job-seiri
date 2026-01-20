# デプロイとテスト手順

## 概要

このサービスはChrome拡張機能からAPIを呼び出すため、**Netlifyにデプロイしてから実際のURLでテストする必要があります**。

## デプロイ手順

### 1. 変更をコミット・プッシュ

```bash
git add -A
git commit -m "変更内容の説明"
git push origin main
```

### 2. Netlifyでの自動デプロイ確認

- GitHubにプッシュすると、Netlifyが自動的にデプロイを開始します
- Netlifyダッシュボードでデプロイ状況を確認
- デプロイが完了するまで数分かかります

### 3. 環境変数の確認

Netlifyダッシュボードで以下の環境変数が設定されているか確認：

**必須（Firebase）:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**オプション（LLM機能）:**
- `GEMINI_API_KEY`（LLM機能を使用する場合）

### 4. デプロイURLの確認

- NetlifyダッシュボードでサイトのURLを確認
- デフォルト: `https://job-seiri.netlify.app`
- カスタムドメインを使用している場合はそのURL

## Chrome拡張機能の設定

### 1. config.jsの作成

`chrome-extension/config.example.js`をコピーして`config.js`を作成：

```bash
cp chrome-extension/config.example.js chrome-extension/config.js
```

### 2. API_URLの設定

`chrome-extension/config.js`を編集して、Netlifyの実際のURLを設定：

```javascript
// Netlifyの実際のURLに変更
const API_URL = "https://job-seiri.netlify.app/api/jobs/capture";
```

**重要**: Netlifyでカスタムドメインを使用している場合は、そのURLに変更してください。

### 3. Firebase設定（必要に応じて）

`chrome-extension/config.js`にFirebase設定を追加（現在はAPI経由なので不要ですが、将来の拡張用）：

```javascript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  // ... 他の設定
};
```

### 4. 拡張機能の読み込み

1. Chromeで `chrome://extensions/` にアクセス
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `chrome-extension`ディレクトリを選択

## テスト手順

### 1. Webアプリの確認

1. NetlifyのURL（例: `https://job-seiri.netlify.app`）にアクセス
2. ログインページが表示されることを確認
3. アカウントを作成またはログイン
4. CSSが正しく適用されているか確認
5. 求人一覧が表示されるか確認

### 2. Chrome拡張機能のテスト

1. 求人サイト（例: SmartHR、Sansan等）を開く
2. Chrome拡張機能のアイコンをクリック
3. 「この求人を保存」をクリック
4. 処理状況が表示されることを確認：
   - 「ページ情報を取得中...」
   - 「求人情報を抽出中...（LLMで整形中）」
   - 「✅ 保存しました!（LLMで整形済み）」

### 3. LLM機能の確認

1. サーバーログを確認（Netlifyダッシュボード → Functions → Logs）
2. 以下のログが表示されることを確認：
   ```
   [LLM] refineWithGemini 開始
   [LLM] API_KEY存在確認: true
   [LLM] Gemini処理時間: XXXms
   [LLM] ルールベース結果と比較: 変更あり/変更なし
   ```

### 4. データの確認

1. Webアプリに戻る
2. 保存した求人が一覧に表示されることを確認
3. 求人カードを展開して、抽出されたデータを確認：
   - 会社名
   - 役職名
   - 年収帯
   - その他の情報

## トラブルシューティング

### CSSが適用されない

1. ブラウザのキャッシュをクリア（Ctrl+Shift+R / Cmd+Shift+R）
2. Netlifyのデプロイログでビルドエラーがないか確認
3. ブラウザの開発者ツール（F12）でCSSファイルが読み込まれているか確認

### 拡張機能が動作しない

1. `chrome-extension/config.js`の`API_URL`が正しいか確認
2. Chrome拡張機能のコンソール（F12）でエラーを確認
3. NetlifyのFunctionsログでAPIエラーを確認

### LLM機能が動作しない

1. Netlifyの環境変数`GEMINI_API_KEY`が設定されているか確認
2. NetlifyのFunctionsログで警告メッセージを確認
3. `[LLM] API_KEY存在確認: false`が表示される場合は環境変数を設定

### デプロイが失敗する

1. Netlifyのデプロイログでエラーを確認
2. ビルドエラーがないか確認
3. 環境変数が正しく設定されているか確認

## デプロイ後の確認チェックリスト

- [ ] Netlifyのデプロイが成功している
- [ ] 環境変数がすべて設定されている
- [ ] Webアプリが正常に表示される（CSS適用確認）
- [ ] ログイン・サインアップが動作する
- [ ] Chrome拡張機能の`config.js`が正しく設定されている
- [ ] 拡張機能から求人を保存できる
- [ ] LLM機能が動作している（ログ確認）
- [ ] 保存した求人がWebアプリに表示される
