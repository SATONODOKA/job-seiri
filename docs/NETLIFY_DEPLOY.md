# Netlifyデプロイ設定ガイド

## 概要

このプロジェクトはNetlifyでデプロイ可能な状態になっています。以下の設定を行ってください。

## 環境変数の設定

Netlifyのダッシュボードで以下の環境変数を設定してください：

### Firebase設定（必須）

1. Netlifyダッシュボードにアクセス
2. サイト設定 → 環境変数 → 変数を追加
3. 以下の環境変数を追加（実際のFirebase設定値に置き換えてください）：

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### LLM設定（オプション）

求人データの整形・補完にLLMを使用する場合は、以下も設定してください：

```
GEMINI_API_KEY=your-gemini-api-key
```

**注意**: `GEMINI_API_KEY`が設定されていない場合、LLM機能はエラーを返します。抽出機能を使用するには、必ずAPIキーを設定してください。

**重要**: 環境変数が設定されていない場合でも、ビルドは成功しますが、実行時にエラーが発生します。必ずすべての環境変数を設定してください。

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
const API_URL = "https://kyujin-bookmark.netlify.app/api/jobs/capture";
```

または、Netlifyの実際のURLに合わせて設定してください。

## デプロイ後の確認事項

1. **環境変数の確認**: Netlifyダッシュボードで環境変数が正しく設定されているか確認
2. **ビルドログの確認**: デプロイ時のビルドログでエラーがないか確認
3. **APIエンドポイントの確認**: `/api/jobs/capture`が正常に動作するか確認
4. **Chrome拡張機能の動作確認**: 本番環境のURLで拡張機能が動作するか確認

## 修正内容（Netlifyデプロイ対応）

以下の修正を行い、Netlifyデプロイに対応しました：

1. **Firebase初期化の改善**
   - 環境変数がない場合でもビルドが成功するように修正
   - サーバーサイドとクライアントサイドで安全に初期化
   - nullチェックを追加して実行時エラーを防止

2. **エラーハンドリングの強化**
   - APIルートでFirebaseのnullチェックを追加
   - クライアントサイドコンポーネントでエラーハンドリングを追加

3. **next.config.jsの最適化**
   - Netlifyデプロイ用の設定を追加
   - ビルド時の型チェックとESLint設定を確認

4. **変数名の衝突を解決**
   - Firebaseの変数名と型名の衝突を修正

## トラブルシューティング

### ビルドエラー

- Node.jsのバージョンを確認（18以上が必要、netlify.tomlで指定）
- 依存関係のインストールエラーがないか確認
- TypeScriptのコンパイルエラーがないか確認
- ビルドログで「Firebase環境変数が設定されていません」という警告が出ても、ビルドは成功します（実行時にエラーが発生します）

### 環境変数エラー

- Netlifyダッシュボードで環境変数が正しく設定されているか確認
- 環境変数名が`NEXT_PUBLIC_`で始まっているか確認（クライアント側で使用する場合）
- ブラウザのコンソールで「Firebaseが初期化されていません」というエラーが出る場合は、環境変数の設定を確認

### APIエラー

- CORS設定が正しいか確認（`app/api/jobs/capture/route.ts`）
- Firebaseの設定が正しいか確認
- APIルートで「Firebaseが初期化されていません」というエラーが出る場合は、環境変数の設定を確認

### 実行時エラー

- ブラウザのコンソールでエラーメッセージを確認
- Netlifyの関数ログでサーバーサイドのエラーを確認
- Firebaseの設定が正しいか確認（Firebase Consoleで確認）
