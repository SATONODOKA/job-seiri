# LLM機能セットアップガイド

## 概要

求人データ抽出にLLM（Gemini API）を使用して、ルールベース抽出の結果を整形・補完します。

## 環境変数設定

### ローカル開発環境

`.env.local` ファイルを作成し、以下を設定してください：

```bash
# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

### Gemini API Keyの取得方法

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. 「Create API Key」をクリック
4. 生成されたAPIキーをコピーして `.env.local` に設定

### Netlify環境

Netlifyのダッシュボードで環境変数を設定：

1. Netlifyダッシュボード → サイト設定 → Environment variables
2. 以下の環境変数を追加：
   - `GEMINI_API_KEY`: あなたのGemini APIキー

## 動作確認

### LLM機能の有効/無効

- `GEMINI_API_KEY` が設定されている場合：LLMで整形・補完を実行
- `GEMINI_API_KEY` が設定されていない場合：ルールベースの結果のみを使用（警告ログを出力）

### ログ確認

開発サーバーを起動して、以下のログを確認：

```bash
npm run dev
```

LLM処理が実行されると、以下のログが出力されます：

```
[Performance] ルールベース抽出処理時間: XXXms
[LLM] Gemini処理時間: XXXms
[Performance] LLM処理時間: XXXms
[Performance] 合計処理時間: XXXms
```

## コスト見積もり

### Gemini 2.0 Flash Exp の料金

- **入力**: $0.075 / 1M tokens
- **出力**: $0.30 / 1M tokens

### 月間使用量の目安

- **1リクエストあたり**: 約2,000-5,000 tokens（入力+出力）
- **月間500件**: 約1M-2.5M tokens
- **月額コスト**: 約 **$0.30 - $0.75**

### 無料枠

Google AI Studio には無料枠がありますが、Gemini API の無料枠は限定的です。
詳細は [Google AI Studio の料金ページ](https://ai.google.dev/pricing) を確認してください。

## トラブルシューティング

### LLMが実行されない

1. `.env.local` に `GEMINI_API_KEY` が設定されているか確認
2. サーバーを再起動（環境変数の変更は再起動が必要）
3. コンソールログで警告メッセージを確認

### APIエラーが発生する

1. APIキーが正しいか確認
2. APIキーの使用制限に達していないか確認
3. ネットワーク接続を確認

### 処理時間が長い

- Gemini 2.0 Flash Exp は高速ですが、初回リクエストは若干時間がかかる場合があります
- 通常は1-3秒程度で完了します

## 今後の拡張

- Ollama（ローカルLLM）対応
- プロンプトの最適化
- キャッシュ機能の追加
