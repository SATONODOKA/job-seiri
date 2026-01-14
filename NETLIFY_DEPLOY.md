# Netlifyデプロイ設定ガイド

## 環境変数の設定

Netlifyのダッシュボードで以下の環境変数を設定してください：

### Firebase設定（必須）

1. Netlifyダッシュボードにアクセス
2. サイト設定 → 環境変数 → 変数を追加
3. 以下の環境変数を追加：

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDg3-q0Hn-GBitx3NscOp6hQ9Fw3LWfRzw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=job-seiri.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=job-seiri
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=job-seiri.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=506993669324
NEXT_PUBLIC_FIREBASE_APP_ID=1:506993669324:web:693e485bcd9a546aefbe69
```

## デプロイ設定

### netlify.toml

- `@netlify/plugin-nextjs`プラグインが自動的にNext.jsの設定を処理します
- `publish`ディレクトリは指定不要（プラグインが自動設定）

### ビルドコマンド

```bash
npm run build
```

### Node.jsバージョン

- Node.js 18を使用（netlify.tomlで指定）

## Chrome拡張機能の設定

### 本番環境用のconfig.js設定

`chrome-extension/config.js`で、本番環境のAPI URLを設定してください：

```javascript
const API_URL = "https://job-seiri.netlify.app/api/jobs/capture";
```

または、Netlifyの実際のURLに合わせて設定してください。

## デプロイ後の確認事項

1. **環境変数の確認**: Netlifyダッシュボードで環境変数が正しく設定されているか確認
2. **ビルドログの確認**: デプロイ時のビルドログでエラーがないか確認
3. **APIエンドポイントの確認**: `/api/jobs/capture`が正常に動作するか確認
4. **Chrome拡張機能の動作確認**: 本番環境のURLで拡張機能が動作するか確認

## トラブルシューティング

### ビルドエラー

- Node.jsのバージョンを確認（18以上が必要）
- 依存関係のインストールエラーがないか確認
- TypeScriptのコンパイルエラーがないか確認

### 環境変数エラー

- Netlifyダッシュボードで環境変数が正しく設定されているか確認
- 環境変数名が`NEXT_PUBLIC_`で始まっているか確認（クライアント側で使用する場合）

### APIエラー

- CORS設定が正しいか確認（`app/api/jobs/capture/route.ts`）
- Firebaseの設定が正しいか確認
