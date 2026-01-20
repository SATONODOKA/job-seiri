# Job Seiri

求人ページをワンクリックで保存し、後で統合的に確認・管理できるフルスタック求人ブックマークアプリケーション。

## 機能

- Chromeブラウザ拡張機能による求人ページのキャプチャ
- Webベースのダッシュボードで保存した求人の閲覧・管理
- LLM（Gemini API）による自動的な求人情報抽出
- ユーザー認証とパーソナライズされた求人コレクション
- Firebaseによるリアルタイムデータ同期

## 技術スタック

- **フロントエンド**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes, Firebase Firestore, Firebase Authentication
- **LLM**: Google Gemini 2.0 Flash Exp
- **デプロイ**: Netlify

## クイックスタート

### 1. セットアップ

詳細なセットアップ手順は [docs/SETUP_CHECKLIST.md](docs/SETUP_CHECKLIST.md) を参照してください。

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下を設定：

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API (LLM機能を使用する場合)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. 開発サーバーの起動

```bash
npm install
npm run dev
```

### 4. Chrome拡張機能の読み込み

1. `chrome://extensions/` を開く
2. 「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `chrome-extension` ディレクトリを選択

## プロジェクト構造

```
job-seiri/
├── app/                    # Next.jsアプリケーション
│   ├── api/               # API Routes
│   │   └── jobs/         # 求人関連API
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # レイアウト
│   └── page.tsx           # メインページ
├── chrome-extension/       # Chrome拡張機能
│   ├── popup.html         # ポップアップUI
│   ├── popup.js           # ポップアップロジック
│   ├── manifest.json      # 拡張機能マニフェスト
│   └── config.js          # 設定ファイル
├── components/             # Reactコンポーネント
│   ├── JobCard.tsx        # 求人カード
│   ├── JobFilters.tsx     # フィルター
│   ├── JobList.tsx        # 求人一覧
│   └── LoginForm.tsx      # ログインフォーム
├── contexts/               # React Context
│   └── AuthContext.tsx    # 認証コンテキスト
├── lib/                   # ライブラリ・ユーティリティ
│   ├── firebase.ts        # Firebase初期化
│   └── llm/               # LLM関連
│       └── providers/
│           └── gemini.ts  # Gemini API プロバイダー
├── types/                 # TypeScript型定義
│   ├── extractedJobData.ts
│   └── job.ts
├── docs/                  # ドキュメント
│   ├── SETUP_CHECKLIST.md      # セットアップ完全チェックリスト
│   ├── LLM_SETUP.md            # LLM機能セットアップガイド
│   ├── NETLIFY_DEPLOY.md       # Netlifyデプロイ手順
│   ├── DEBUG_LLM.md            # LLM機能デバッグガイド
│   ├── FLOW_ANALYSIS.md         # サービス機能フロー分析
│   ├── LLM_ANALYSIS.md          # LLM機能の構造分析
│   └── NEXT_STEPS_REQUIRED.md   # 今から必要な準備
└── [設定ファイル]         # package.json, tsconfig.json など
```

## ドキュメント

- [セットアップ完全チェックリスト](docs/SETUP_CHECKLIST.md) - 初回セットアップ手順
- [LLM機能セットアップ](docs/LLM_SETUP.md) - Gemini API設定
- [Netlifyデプロイ手順](docs/NETLIFY_DEPLOY.md) - デプロイ方法
- [LLM機能デバッグ](docs/DEBUG_LLM.md) - トラブルシューティング
- [サービス機能フロー](docs/FLOW_ANALYSIS.md) - アーキテクチャ概要
- [LLM機能分析](docs/LLM_ANALYSIS.md) - LLM処理の詳細

## 開発

### ビルド

```bash
npm run build
```

### リント

```bash
npm run lint
```

## ライセンス

Private
