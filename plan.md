# Job Seiri プロジェクト - 詳細分析プラン

## プロジェクト概要

**Job Seiri**（求人整理）は、求人ページをワンクリックで保存し、後で統合的に確認・管理できるフルスタック求人ブックマークアプリケーションです。

### 主な機能
- Chromeブラウザ拡張機能による求人ページのキャプチャ
- Webベースのダッシュボードで保存した求人の閲覧・管理
- ユーザー認証とパーソナライズされた求人コレクション
- Firebaseによるリアルタイムデータ同期

---

## 技術スタック

### フロントエンド
- **Next.js 14.2.5** - React フレームワーク（SSR/CSR）
- **React 18** - UI コンポーネントライブラリ
- **TypeScript 5** - 型安全な JavaScript
- **Tailwind CSS 3.3** - ユーティリティファーストCSS
- **日本語フォント**: Noto Sans JP + Inter

### バックエンド
- **Next.js API Routes** - サーバーレスバックエンド
- **Firebase Firestore** - リアルタイムNoSQLデータベース
- **Firebase Authentication** - メール/パスワード認証

### ブラウザ拡張機能
- **Chrome Extension Manifest V3** - モダンな拡張機能API
- **Vanilla JavaScript** - 拡張機能のポップアップとコンテンツスクリプト

### デプロイメント
- **Netlify** - Next.jsアプリのホスティング
- **Firebase** - バックエンドサービス（Firestore + Auth）

---

## ファイル構造

```
job-seiri/
├── app/                          # Next.js App Router
│   ├── api/jobs/capture/
│   │   └── route.ts              # 求人保存APIエンドポイント
│   ├── layout.tsx                # ルートレイアウト（AuthProvider）
│   ├── page.tsx                  # メインダッシュボード
│   └── globals.css               # グローバルスタイル
│
├── components/                   # Reactコンポーネント
│   ├── LoginForm.tsx             # 認証フォーム（ログイン/サインアップ）
│   ├── JobList.tsx               # 保存された求人リスト（リアルタイム）
│   └── JobCard.tsx               # 個別求人カード（展開/削除機能）
│
├── contexts/
│   └── AuthContext.tsx           # 認証状態管理
│
├── lib/
│   └── firebase.ts               # Firebase初期化
│
├── types/
│   └── job.ts                    # Job型定義
│
├── chrome-extension/             # ブラウザ拡張機能
│   ├── manifest.json             # 拡張機能メタデータ
│   ├── popup.html                # 拡張機能ポップアップUI
│   ├── popup.js                  # 拡張機能ロジック
│   ├── config.js                 # Firebase設定（gitignore）
│   └── config.example.js         # 設定テンプレート
│
├── reference/
│   └── job_seiri_data_design_v1.md  # データ設計ドキュメント
│
├── .env.local                    # 環境変数（gitignore）
├── package.json                  # 依存関係
├── tsconfig.json                 # TypeScript設定
├── tailwind.config.ts            # Tailwind CSS設定
├── next.config.js                # Next.js設定
├── netlify.toml                  # Netlifyデプロイ設定
└── postcss.config.mjs            # PostCSS設定
```

---

## 主要コンポーネントと関係性

### 1. 認証フロー（AuthContext）
**ファイル**: `contexts/AuthContext.tsx`

- Firebase Authentication（メール/パスワード）を使用
- アプリ全体で`user`、`loading`、`logout`を提供
- `layout.tsx`で`<AuthProvider>`としてラップ

### 2. メインダッシュボード
**ファイル**: `app/page.tsx`

- 認証済みユーザーのエントリーポイント
- ヘッダーに「Job Seiri」タイトルとログアウトボタン
- `<JobList />`コンポーネントをレンダリング
- 未認証時は`<LoginForm />`を表示

### 3. 求人管理コンポーネント

#### LoginForm.tsx
- ユーザー登録とログインを処理
- ログイン/サインアップモード切り替え
- 日本語でのエラーハンドリング
- Firebase Auth使用（`signInWithEmailAndPassword`、`createUserWithEmailAndPassword`）

#### JobList.tsx
- Firestoreからリアルタイムで求人を取得
- `collection`、`query`、`orderBy`でデータ取得
- `onSnapshot`でリアルタイム更新
- 各求人を`<JobCard />`でマッピング表示

#### JobCard.tsx
- 求人タイトルとソースドメインを表示
- 展開可能なカード（求人内容表示）
- アクションボタン：「元ページを開く」「削除」
- 日本語での日付フォーマット

### 4. APIルート
**ファイル**: `app/api/jobs/capture/route.ts`

- エンドポイント: `POST /api/jobs/capture`
- Chrome拡張機能からのデータを処理
- `url`と`title`パラメータを検証
- Firestoreにメタデータ付きで保存:
  - `url`、`title`、`content`
  - `createdAt`（サーバータイムスタンプ）
  - `sourceHost`、`isPinned`、`isArchived`、`pageType`
- CORS有効化（拡張機能通信用）

### 5. Chrome拡張機能

#### manifest.json
- Manifest V3使用（モダンスタンダード）
- `activeTab`と`scripting`権限が必要
- `host_permissions`: `<all_urls>`（全ページキャプチャ用）

#### popup.js
- ページ情報キャプチャ：`url`、`title`、`content`（最初の10,000文字）
- `chrome.scripting.executeScript`で動的スクリプトインジェクション
- `/api/jobs/capture`エンドポイントにPOST
- エラーハンドリング

---

## データモデル

### Job型（types/job.ts）
```typescript
interface Job {
  id: string;                    // FirestoreドキュメントID
  url: string;                   // 元のページURL
  title: string;                 // ページタイトル
  content: string;               // ページテキストの最初の10,000文字
  createdAt: Date | null;        // タイムスタンプ（Firestore）
}
```

### Firestoreの追加フィールド
- `sourceHost` - URLから抽出されたドメイン
- `isPinned` - ユーザーによるピン留めステータス（予定機能）
- `isArchived` - アーカイブステータス（予定機能）
- `pageType` - 求人ソースの分類（予定機能）

---

## 設定と環境要件

### 環境変数（.env.local）
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDg3-q0Hn-GBitx3NscOp6hQ9Fw3LWfRzw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=job-seiri.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=job-seiri
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=job-seiri.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=506993669324
NEXT_PUBLIC_FIREBASE_APP_ID=1:506993669324:web:693e485bcd9a546aefbe69
```

### Chrome拡張機能設定
- `chrome-extension/config.js`（gitignore）をテンプレートから作成
- 拡張機能用のFirebase APIキーを含む
- バージョン管理にコミットしない

### Firebaseセットアップ
- `jobs`コレクションを持つFirestoreデータベース
- メール/パスワード認証が有効
- APIアクセス用にCORS設定

---

## 開発ワークフロー

### ローカル開発
1. Firebase認証情報で`.env.local`を設定
2. `npm install`を実行
3. 開発サーバー起動: `npm run dev`（ポート3001）
4. `chrome-extension/`フォルダからChrome拡張機能をロード

### Chrome拡張機能の読み込み
1. `chrome://extensions/`を開く
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `chrome-extension/`フォルダを選択

### テストフロー
1. 任意の求人ページにアクセス
2. 拡張機能アイコンをクリック
3. 「この求人を保存」ボタンをクリック
4. データがキャプチャされFirestoreに送信
5. ダッシュボードで新しい求人を確認

### ビルドとデプロイ
- **開発**: `npm run dev`
- **ビルド**: `npm run build`
- **デプロイ**: Netlify（Next.jsプラグイン使用）
- **リント**: `npm run lint`

---

## セキュリティ考慮事項

1. **APIキー** - Firebase キーは環境変数で公開（フロントエンド用）
   - 現在の実装はCORS有効化エンドポイント使用
   - 拡張機能は`config.js`設定が必要（バージョン管理から分離）

2. **CORS** - APIルートは全オリジンを許可

3. **データベースルール** - 読み書き前に認証を強制すべき（コードには未記載）

4. **Git保護** - `.env.local`と`chrome-extension/config.js`はgitignore

---

## 現在の開発状況

### 完了済み
✅ UI設計とレイアウト
✅ Firebase統合（Firestore + Auth）
✅ リアルタイム更新による求人リスト表示
✅ Chrome拡張機能の基本機能
✅ 求人カードの展開と削除
✅ セキュリティインシデント対応（APIキー管理）

### 進行中/保留中
- Chrome拡張機能の改善（ユニバーサルURLサポート）
- 高度なフィルタリングと分類
- AI駆動の求人マッチング（フェーズ6）

---

## 重要ファイルパス

### 認証・状態管理
- `contexts/AuthContext.tsx` - 認証コンテキスト
- `app/layout.tsx` - ルートレイアウト

### コンポーネント
- `components/LoginForm.tsx` - ログイン/サインアップ
- `components/JobList.tsx` - 求人リスト
- `components/JobCard.tsx` - 求人カード

### API
- `app/api/jobs/capture/route.ts` - 求人キャプチャAPI

### 拡張機能
- `chrome-extension/manifest.json` - 拡張機能設定
- `chrome-extension/popup.js` - メインロジック

### 設定
- `.env.local` - 環境変数
- `tailwind.config.ts` - Tailwind設定
- `next.config.js` - Next.js設定
- `netlify.toml` - デプロイ設定

---

## 検証方法

### エンドツーエンドテスト
1. ローカル開発サーバーを起動（`npm run dev`）
2. Chrome拡張機能をロード
3. 任意の求人ページで拡張機能を実行
4. ダッシュボードで求人が表示されることを確認
5. 求人カードの展開、削除機能をテスト
6. ログアウト/ログイン機能をテスト

### ビルドテスト
1. `npm run build`でプロダクションビルド
2. `npm run lint`でコード品質確認
3. ビルド成果物の確認

---

## プロジェクトの強み

- モダンなNext.js App Routerアーキテクチャ
- TypeScriptによる型安全性
- Tailwind CSSによる迅速なUI開発
- Firebaseによるリアルタイムデータ同期
- Chrome Manifest V3対応の将来性
- 日本語に最適化されたUI/UX

---

# データ構造化実装プラン

## 🔀 並列開発戦略（推奨アプローチ）

### 基本方針
- **ブランチ単位で機能開発**: 各機能を独立したブランチで開発
- **並列作業**: 複数のClaude Codeインスタンスで同時作業可能
- **テスト後マージ**: 動作確認できたものだけmainに統合
- **小さく始める**: 大仰にせず、一個ずつ確実に

### ブランチ戦略

```
main (現在のクリーンな状態)
├── feature/phase1-type-extension     # 型定義拡張のみ
├── feature/phase1-status-ui          # 応募ステータスUI
├── feature/phase1-filter-sort        # フィルタ・ソート機能
├── feature/phase2-structured-fields  # 構造化フィールド型追加
├── feature/phase3-page-detector      # ページ種別判定
├── feature/phase3-salary-extractor   # 給与抽出
└── feature/phase3-location-extractor # 勤務地抽出
```

### 推奨作業順序

#### ターミナル1（最優先）: 型定義拡張
```bash
git checkout -b feature/phase1-type-extension
# types/job.ts を拡張
# app/api/jobs/capture/route.ts でデフォルト値設定
# テスト → OK なら main にマージ
```

#### ターミナル2: 応募ステータスUI
```bash
git checkout -b feature/phase1-status-ui
# JobCard.tsx にステータス管理UI追加
# テスト → OK なら main にマージ
```

#### ターミナル3: フィルタ・ソート
```bash
git checkout -b feature/phase1-filter-sort
# JobFilters.tsx 新規作成
# JobList.tsx にフィルタ・ソート機能追加
# テスト → OK なら main にマージ
```

### 各ブランチの作業内容（詳細は後述）

| ブランチ名 | 作業内容 | 依存関係 | 推定作業時間 |
|---------|---------|---------|------------|
| `feature/phase1-type-extension` | 型定義拡張 + API修正 | なし | 10分 |
| `feature/phase1-status-ui` | JobCard UI拡張 | 型定義拡張 | 20分 |
| `feature/phase1-filter-sort` | フィルタ・ソート実装 | 型定義拡張 | 30分 |
| `feature/phase2-structured-fields` | 構造化フィールド型追加 | Phase 1完了 | 15分 |
| `feature/phase3-page-detector` | ページ種別判定 | Phase 2完了 | 30分 |
| `feature/phase3-salary-extractor` | 給与抽出ロジック | Phase 2完了 | 40分 |
| `feature/phase3-location-extractor` | 勤務地抽出ロジック | Phase 2完了 | 20分 |

### 並列作業のルール

1. **依存関係を守る**
   - Phase 1の型定義拡張は最初に完了させる（他の作業の前提）
   - Phase 1完了後、Phase 2とPhase 3の一部は並列作業可能

2. **コンフリクト回避**
   - 同じファイルを編集するブランチは並列作業しない
   - 例: `types/job.ts` を編集する作業は順次実行

3. **テストとマージ**
   - 各ブランチで動作確認
   - 問題なければ `main` にマージ
   - マージ後、他のブランチを `main` から最新化（rebase）

### マージ順序（推奨）

```
1. feature/phase1-type-extension → main
2. feature/phase1-status-ui → main (rebase後)
3. feature/phase1-filter-sort → main (rebase後)
4. feature/phase2-structured-fields → main
5. feature/phase3-page-detector → main
6. feature/phase3-salary-extractor → main
7. feature/phase3-location-extractor → main
```

---

## 現状分析

### 問題点
1. **型定義とFirestoreデータの不一致**
   - Firestore: `sourceHost`, `isPinned`, `isArchived`, `pageType` を保存
   - TypeScript: `id`, `url`, `title`, `content`, `createdAt` のみ定義
   - コンポーネント: 拡張フィールドを認識・表示できない

2. **データ活用の限界**
   - タイトルと本文のみで管理
   - 並び替え: `createdAt` 降順のみ（固定）
   - フィルタリング機能なし
   - 応募状況管理できない
   - 構造化データ（会社名、給与、勤務地等）なし

3. **UI/UX の制約**
   - カードビューのみ
   - 一覧性が低い
   - データの比較・編集が困難

### 既存の資産
- `reference/job_seiri_data_design_v1.md` に詳細なデータ設計とルールベース抽出ロジック
- APIエンドポイント（`/api/jobs/capture`）は既に基本フィールドを保存
- Firebase Authによる認証基盤

---

## 実装戦略

### 設計方針
1. **段階的アプローチ**: 簡単な機能から順次実装
2. **ルールベース優先**: LLMは最後の補正役（Phase 3以降）
3. **型安全性の確保**: TypeScript型定義を先に整備
4. **UI後回し**: データ構造確立を最優先

### 実装フェーズ

#### **Phase 1: 型定義の拡張と応募ステータス管理（最優先）**

**目的**: 既存データとの整合性を取り、即座に使える管理機能を追加

**1.1 型定義の拡張**
- `types/job.ts` を拡張
- 既にFirestoreに保存されているフィールドを型に追加:
  - `sourceHost: string`
  - `isPinned: boolean`
  - `isArchived: boolean`
  - `pageType: "job_detail" | "job_list" | "non_job" | "unknown"`

- 応募管理フィールドを追加:
  - `applicationStatus: "not_applied" | "applied" | "interview" | "offer" | "rejected" | "withdrawn" | null`
  - `applicationDate: Date | null`
  - `userNote: string | null`
  - `userRating: number | null` (0-5段階評価)

**1.2 既存データのマイグレーション**
- 既存の Job ドキュメントに新フィールドを追加する必要なし（Firestoreは動的スキーマ）
- 新規保存時のデフォルト値設定:
  - `applicationStatus: "not_applied"`
  - `applicationDate: null`
  - `userNote: null`
  - `userRating: null`

**1.3 UI への反映**
- `JobCard.tsx` に応募ステータス表示と編集機能を追加
- ステータス変更のドロップダウン
- メモ入力欄（展開時）
- 評価の星アイコン

**1.4 JobList のフィルタ・ソート機能**
- ステータスでフィルタ（未応募のみ、応募済みのみ等）
- ピン留めを最上部表示
- 複数ソートオプション:
  - 保存日（新しい順/古い順）
  - 評価（高い順）
  - 応募日

**対象ファイル**:
- `types/job.ts` - 型拡張
- `app/api/jobs/capture/route.ts` - デフォルト値追加
- `components/JobCard.tsx` - ステータス管理UI
- `components/JobList.tsx` - フィルタ・ソート機能
- 新規: `components/JobFilters.tsx` - フィルタUI

---

#### **Phase 2: 構造化フィールドの追加（段階的）**

**目的**: 会社名、給与、勤務地などの基本情報をデータとして持つ

**2.1 型定義への構造化フィールド追加**

参照: `reference/job_seiri_data_design_v1.md` のセクション1.1

追加フィールド:
```typescript
// 解析メタ情報
parseVersion: string;
parseConfidence: number; // 0-1
parseIssues: string[];

// 構造化フィールド
companyName: string | null;
jobTitle: string | null;
employmentType: "full_time" | "contract" | "temporary" | "intern" | "other" | null;

salaryMin: number | null;
salaryMax: number | null;
salaryBand: "〜500" | "500-700" | "700-900" | "900+" | null;

locationText: string | null;
remoteType: "onsite" | "hybrid" | "remote" | "unknown";

jobType: string | null;
industry: string | null;

requiredYears: number | null;
seniorityLevel: "junior" | "mid" | "senior" | "manager" | null;
```

**2.2 初期実装の方針**

Phase 2では、まず**型定義だけ**を追加し、すべて `null` のまま保存。
これにより：
- 型安全性を確保
- 将来のルールベース抽出実装の準備
- 手動入力欄の追加（ユーザーが任意で入力可能）

**2.3 UI対応（オプション）**

JobCard展開時に、構造化フィールドの表示・編集欄を追加:
- 会社名
- 職種
- 給与レンジ
- 勤務地
- リモート可否

最初は手動入力のみ。Phase 3でルールベース自動抽出を実装。

**対象ファイル**:
- `types/job.ts` - 構造化フィールド追加
- `app/api/jobs/capture/route.ts` - nullで保存
- `components/JobCard.tsx` - 表示・編集欄追加（オプション）

---

#### **Phase 3: ルールベース抽出の実装（ロジック重視）**

**目的**: Chrome拡張でキャプチャした `content` から、ルールベースで情報を抽出

**3.1 ページ種別判定の実装**

参照: `reference/job_seiri_data_design_v1.md` のセクション3

**実装内容**:
- 新規ファイル: `lib/parsers/pageTypeDetector.ts`
- content を解析し、`pageType` を判定:
  - `job_detail`: 求人詳細ページ
  - `job_list`: 求人一覧ページ
  - `non_job`: 求人以外
  - `unknown`: 判定不能

**判定ロジック**:
- スコアリング方式
- キーワードマッチング（「募集要項」「応募資格」「勤務地」等）
- 一覧ページ判定（「件中」「検索結果」「次へ」等）

**3.2 給与抽出の実装**

参照: `reference/job_seiri_data_design_v1.md` のセクション4.2

**実装内容**:
- 新規ファイル: `lib/parsers/salaryExtractor.ts`

**ステップ**:
1. 給与セクション候補の抽出（「給与」「年収」を含む行の前後±4行）
2. 数値抽出（万円表記、円表記）
3. ノイズ対策（「交通費」「福利厚生」を含むセクションは除外）
4. `salaryMin`, `salaryMax`, `salaryBand` を設定

**3.3 勤務地・リモート抽出**

参照: `reference/job_seiri_data_design_v1.md` のセクション4.3

**実装内容**:
- 新規ファイル: `lib/parsers/locationExtractor.ts`

**ステップ**:
1. 「勤務地」を含む行の抽出 → `locationText`
2. リモートワード判定 → `remoteType`
   - 「フルリモート」→ remote
   - 「ハイブリッド」→ hybrid
   - 「原則出社」→ onsite

**3.4 その他フィールドの抽出**

- 雇用形態: `lib/parsers/employmentTypeExtractor.ts`
- 職種: `lib/parsers/jobTypeExtractor.ts`
- 業種: `lib/parsers/industryExtractor.ts`
- 経験年数: `lib/parsers/experienceExtractor.ts`

各ファイルで、`reference/job_seiri_data_design_v1.md` のセクション4に記載されたロジックを実装。

**3.5 統合パーサーの実装**

**実装内容**:
- 新規ファイル: `lib/parsers/jobParser.ts`

すべての抽出関数を統合し、以下を返す:
```typescript
function parseJobContent(content: string, url: string, title: string): ParsedJobData {
  // pageType判定
  // 各フィールド抽出
  // parseConfidence計算
  // parseIssues収集
  return { ...extractedFields, parseVersion: "v1.0" };
}
```

**3.6 APIルートでの統合**

`app/api/jobs/capture/route.ts` を修正:
- `parseJobContent()` を呼び出し
- 抽出結果をFirestoreに保存

**対象ファイル**:
- 新規: `lib/parsers/pageTypeDetector.ts`
- 新規: `lib/parsers/salaryExtractor.ts`
- 新規: `lib/parsers/locationExtractor.ts`
- 新規: `lib/parsers/employmentTypeExtractor.ts`
- 新規: `lib/parsers/jobTypeExtractor.ts`
- 新規: `lib/parsers/industryExtractor.ts`
- 新規: `lib/parsers/experienceExtractor.ts`
- 新規: `lib/parsers/jobParser.ts`
- 修正: `app/api/jobs/capture/route.ts`

---

#### **Phase 3.5: 抽出ロジックの改善と多様性対応（緊急修正）**

**目的**: 実装済みの抽出ロジックの問題点を修正し、多様な求人フォーマットに対応

**背景**: 
- 改善後のテスト結果（`test-results/improved-extraction-results.md`）で、役職名抽出が悪化
- 3つのテストケースで問題が発見されたが、実際の求人フォーマットはさらに多様
- LLM無しでできる限り対応する方針

**3.5.1 役職名抽出の問題点と原因分析**

**発見された問題**:

1. **見出し行自体を抽出してしまう**
   - マネーフォワード: 「職種 / 募集ポジション」という見出し行を抽出
   - デロイト: 「主な業務内容」という見出し行を抽出
   - 原因: 正規表現が「職種[:：\s\t]+(.+?)」を想定しているが、実際にはタブ区切りや見出し行の次の行に値がある

2. **content内に「職種」セクションがない場合のフォールバックが不十分**
   - freee: content内に「募集職種」や「職種」のセクションが見当たらない
   - 結果として、titleから「エンジニアリング基盤本部」を抽出（部署名を抽出してしまっている）

3. **タブ区切りの形式に対応していない**
   - マネーフォワード: 「職種 / 募集ポジション\t【プロダクトデザイナー（UI/UX）_オープンポジション】_東京（田町）」
   - 現在のロジックは「職種: XXX」や「職種 XXX」の形式を想定

**3.5.2 改善方針**

**多様なフォーマットに対応する段階的アプローチ**:

1. **content内の探索を改善**
   - 見出し行を除外し、次の行を取得
   - タブ区切り、コロン区切り、スペース区切りに対応
   - 見出し行のパターンを認識（「職種 / 募集ポジション」など）

2. **titleからの抽出を改善**
   - 部署名（【】で囲まれた部分）を除外
   - 場所情報（「_東京（田町）」など）を除外
   - より正確なクリーニングロジック

3. **フォールバック戦略の強化**
   - content内に「職種」セクションがない場合、titleのクリーニングを優先
   - 複数の候補がある場合、最も短く、かつ意味のある文字列を選択

**3.5.3 実装詳細**

**修正対象ファイル**: `lib/parsers/jobExtractor.ts` の `extractJobTitle` 関数

**改善内容**:

1. **見出し行の認識と除外**
```typescript
// 見出し行のパターン
const headingPatterns = [
  /^職種\s*[\/／]\s*募集ポジション/,
  /^募集職種/,
  /^職種[:：\s\t]*$/,
  /^ポジション[:：\s\t]*$/
];

// 見出し行の次の行を取得
function findNextNonHeadingLine(lines: string[], startIndex: number): string | null {
  for (let i = startIndex + 1; i < Math.min(startIndex + 5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;
    
    // 見出し行パターンに一致しない場合
    if (!headingPatterns.some(pattern => pattern.test(line))) {
      // 長すぎる場合は除外（説明文の可能性）
      if (line.length > 0 && line.length < 100) {
        return line;
      }
    }
  }
  return null;
}
```

2. **タブ区切り形式への対応**
```typescript
// タブ区切りの形式: 「職種 / 募集ポジション\t【役職名】」
const tabSeparatedPattern = /職種\s*[\/／]?\s*募集ポジション?\s*\t(.+)/;
const tabMatch = content.match(tabSeparatedPattern);
if (tabMatch && tabMatch[1]) {
  const jobTitle = tabMatch[1].trim();
  // クリーニング（【】や場所情報を除去）
  return cleanJobTitle(jobTitle);
}
```

3. **titleクリーニングの強化**
```typescript
function cleanJobTitle(title: string): string {
  let cleaned = title;
  
  // 【部署名】を除去（最初の【】のみ）
  cleaned = cleaned.replace(/^【.+?】/, '').trim();
  
  // [会社名]を除去
  cleaned = cleaned.replace(/^\[.+?\]/, '').trim();
  
  // 「|」で区切られた部分を除去（後ろの部分）
  cleaned = cleaned.replace(/\s*[|｜]\s*.+$/, '').trim();
  
  // 「_」で区切られた部分を除去（場所情報など）
  cleaned = cleaned.replace(/_\s*.+$/, '').trim();
  
  // 末尾の「（場所）」を除去
  cleaned = cleaned.replace(/\([^)]*\)$/, '').trim();
  
  // 「募集」を除去
  cleaned = cleaned.replace(/募集$/, '').trim();
  
  // 先頭の「|」より前を除去
  cleaned = cleaned.replace(/^.+?[\s|｜｜]/, '').trim();
  
  // 【】で囲まれた部分を除去（残っている場合）
  cleaned = cleaned.replace(/【.+?】/g, '').trim();
  
  return cleaned;
}
```

4. **段階的な探索戦略**
```typescript
function extractJobTitle(title: string, content: string): string | null {
  const lines = content.split('\n');
  
  // 1. タブ区切り形式を最優先
  const tabResult = extractFromTabSeparated(content);
  if (tabResult) return cleanJobTitle(tabResult);
  
  // 2. content内の「職種」セクションを探索（見出し行を除外）
  const contentResult = extractFromContentSection(lines);
  if (contentResult) return cleanJobTitle(contentResult);
  
  // 3. titleのクリーニング（フォールバック）
  const titleResult = cleanJobTitle(title);
  if (titleResult.length > 0 && titleResult.length < 100) {
    return titleResult;
  }
  
  return null;
}
```

**3.5.4 会社名抽出の改善**

**問題**: デロイトの完全な会社名「合同会社デロイト トーマツ」を抽出できていない

**改善内容**:
- タブ区切りや複数行にわたる会社名情報に対応
- 「合同会社デロイト トーマツ」のような複合的な会社名に対応
- 次の行も探索範囲に含める

**3.5.5 テスト戦略**

**多様なフォーマットに対応するため**:
1. 既存の3つのテストケースで再テスト
2. 追加のテストケースを収集（様々な求人サイトから）
3. エッジケースのテスト（見出し行がない、タブ区切りがない、titleが複雑など）

**3.5.6 実装の優先順位**

1. **最優先**: 役職名抽出の修正（見出し行の除外、タブ区切り対応）
2. **重要**: 会社名抽出の精度向上（複合的な会社名に対応）
3. **オプション**: より多くのテストケースでの検証

**対象ファイル**:
- 修正: `lib/parsers/jobExtractor.ts` - `extractJobTitle` 関数の全面的な改善
- 修正: `lib/parsers/jobExtractor.ts` - `extractCompanyName` 関数の改善
- 新規: `test-results/test-diverse-formats.ts` - 多様なフォーマットのテストケース

**検証方法**:
1. 既存の3つのテストケースで再テスト
2. 抽出結果を `test-results/diverse-extraction-results.md` に記録
3. 改善前後の比較を実施

**実装状況**: ✅ 完了（v2改善ロジック実装済み）

---

#### **Phase 3.6: URLベースの会社名推測とATS対応**

**目的**: URLパターンから会社名を推測し、herpのようなATS（Applicant Tracking System）に対応

**背景**: 
- herp.careersのようなATSを使っている場合、URLパターンから会社名を推測できる
- 例: `https://herp.careers/v1/freee/jobs/analytics` → 「freee」から「フリー株式会社」を推測
- contentやtitleから抽出できない場合のフォールバックとして重要

**3.6.1 URLパターンの分析**

**主要なATSとURLパターン**:

1. **herp.careers**
   - パターン: `https://herp.careers/v1/{company}/jobs/{job_id}`
   - 例: `https://herp.careers/v1/freee/jobs/analytics`
   - 会社名: URLの`/v1/`と`/jobs/`の間の部分から推測

2. **Green（グリーン）**
   - パターン: `https://www.green-japan.com/company/{company_id}/job/{job_id}`
   - 会社名: contentから抽出（URLからは直接取得困難）

3. **Wantedly**
   - パターン: `https://www.wantedly.com/companies/{company}/postings/{job_id}`
   - 会社名: URLの`/companies/`と`/postings/`の間の部分から推測

4. **自社サイト**
   - パターン: `https://{company}.com/careers/{job_id}` など
   - 会社名: ドメイン名から推測

**3.6.2 実装詳細**

**修正対象ファイル**: `lib/parsers/jobExtractor.ts` の `extractCompanyName` 関数

**改善内容**:

1. **URLパターンマッチング**
```typescript
function extractCompanyNameFromURL(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;
    
    // herp.careers パターン
    const herpMatch = pathname.match(/\/v1\/([^\/]+)\/jobs\//);
    if (herpMatch && herpMatch[1]) {
      const companySlug = herpMatch[1];
      // スラッグから会社名を推測（例: "freee" → "フリー株式会社"）
      return guessCompanyNameFromSlug(companySlug);
    }
    
    // Wantedly パターン
    const wantedlyMatch = pathname.match(/\/companies\/([^\/]+)\/postings\//);
    if (wantedlyMatch && wantedlyMatch[1]) {
      return guessCompanyNameFromSlug(wantedlyMatch[1]);
    }
    
    // 自社サイトパターン（ドメインから推測）
    if (hostname.includes('.com') || hostname.includes('.co.jp')) {
      const domainParts = hostname.split('.');
      if (domainParts.length >= 2) {
        const mainDomain = domainParts[0];
        // ドメイン名から会社名を推測
        return guessCompanyNameFromDomain(mainDomain);
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}
```

2. **スラッグから会社名の推測**
```typescript
function guessCompanyNameFromSlug(slug: string): string | null {
  // 既知のスラッグ→会社名マッピング
  const knownMappings: Record<string, string> = {
    'freee': 'フリー株式会社',
    'moneyforward': '株式会社マネーフォワード',
    'deloitte': '合同会社デロイト トーマツ',
    // 必要に応じて追加
  };
  
  if (knownMappings[slug.toLowerCase()]) {
    return knownMappings[slug.toLowerCase()];
  }
  
  // スラッグから推測（例: "money-forward" → "マネーフォワード"）
  // ハイフンを除去し、キャメルケースを日本語に変換する試み
  // ただし、これは限定的なので、既知のマッピングを優先
  
  return null;
}
```

3. **extractCompanyName関数への統合**
```typescript
function extractCompanyName(title: string, content: string, url: string): string | null {
  // 1. content内の「会社名」セクションを優先探索（既存ロジック）
  // ...
  
  // 2. URLから推測（フォールバック）
  const urlBasedName = extractCompanyNameFromURL(url);
  if (urlBasedName) {
    return urlBasedName;
  }
  
  // 3. その他の既存ロジック
  // ...
}
```

**3.6.3 既存データの再抽出機能**

**実装状況**: ✅ 完了（`app/api/jobs/re-extract/route.ts` 実装済み）

**機能**:
- 特定のジョブIDを指定して再抽出
- すべてのジョブを一括再抽出（companyNameがnullのもののみ）
- 抽出結果をFirestoreに自動更新

**使い方**:
```bash
# すべてのジョブを再抽出
curl -X POST http://localhost:3000/api/jobs/re-extract \
  -H "Content-Type: application/json" \
  -d '{}'
```

**3.6.4 JobCardのフォールバックロジック**

**実装状況**: ✅ 完了（`components/JobCard.tsx` 実装済み）

**機能**:
- `companyName`または`jobTitle`がない場合、`content`と`URL`から`extractJobData`で再抽出
- 既存データでも、contentがあれば正確に抽出可能
- titleではなく、contentとURLを優先して使用

**対象ファイル**:
- 修正: `lib/parsers/jobExtractor.ts` - `extractCompanyName` 関数にURL推測ロジックを追加
- 修正: `lib/parsers/jobExtractor.ts` - `extractJobData` 関数にURLパラメータを追加
- 新規: `lib/parsers/urlCompanyExtractor.ts` - URLから会社名を推測する専用モジュール（オプション）
- 修正: `app/api/jobs/capture/route.ts` - URLを`extractJobData`に渡す

**検証方法**:
1. herp.careersのURLでテスト（freeeのケース）
2. 他のATSのURLパターンでテスト
3. 自社サイトのURLパターンでテスト
4. 抽出結果を `test-results/url-extraction-results.md` に記録

---

#### **Phase 3.7: 抽出ロジックのさらなる改善**

**目的**: より多様なフォーマットに対応し、抽出精度を向上

**3.7.1 会社名抽出の改善**

**課題**:
- デロイトの完全な会社名「合同会社デロイト トーマツ」を抽出できているが、より確実に
- 複数行にわたる会社名情報に対応
- タブ区切りや特殊な区切り文字に対応

**改善案**:
- 複数行にわたる会社名情報の結合ロジックを改善
- より多くの法人格パターンに対応（「一般社団法人」「NPO法人」など）
- 会社名の正規化（「株式会社XXX」と「XXX株式会社」の統一）

**3.7.2 役職名抽出の改善**

**課題**:
- デロイトの役職名が「コンサルティング」のみ（より具体的な情報が欲しい場合がある）
- 長すぎる役職名のクリーニング
- 複数の役職名候補がある場合の選択ロジック

**改善案**:
- 役職名の長さ制限を調整（50文字以下を推奨）
- 複数の候補がある場合、最も短く、かつ意味のある文字列を選択
- content内の「募集職種」セクションの探索をより柔軟に

**3.7.3 年収抽出の改善**

**課題**:
- デロイトの年収情報が抽出できていない（contentに情報がない可能性）
- 「応相談」の後の情報抽出をより確実に
- 月給から年収への換算ロジック

**改善案**:
- 「応相談」の後の情報抽出を改善
- 月給情報から年収を推測（月給 × 12 + ボーナス想定）
- より多くの年収表記パターンに対応

**対象ファイル**:
- 修正: `lib/parsers/jobExtractor.ts` - 各抽出関数の改善
- 新規: `test-results/v3-extraction-results.md` - v3改善後のテスト結果

**検証方法**:
1. 既存の3つのテストケースで再テスト
2. 追加のテストケースを収集（様々な求人サイトから）
3. エッジケースのテスト
4. 改善前後の比較を実施

---

#### **Phase 3.8: UI表示とデータフローの修正（緊急対応）** 🔴 **最優先**

**目的**: JobCardで会社名や年収帯が表示されない問題を修正

**背景**: 
- Playwrightテストで、JobCard[2]で会社名が表示されていない
- 年収帯は表示されているが、会社名が「プロダクトデザイナー（UI/UX）_オープンポジション：_東京（田町）」となっており、会社名部分が空
- 抽出API自体は正しく動作している（テストでは「株式会社マネーフォワード」が正しく抽出されている）

**3.8.1 問題点の分析**

**発見された問題**:

1. **JobCardの表示ロジックの問題**
   - `displayData`の計算で`extractedData`が正しく参照されていない
   - `useMemo`の依存配列に`extractedData`が含まれていない可能性
   - `extractedData`の状態更新が行われているが、表示に反映されていない

2. **再抽出APIの問題**
   - `re-extract` APIは`companyName`がnullのもののみを対象にしている
   - 実際には`companyName`が存在するが空文字列の場合や、`jobTitle`や`salaryBand`がnullの場合も再抽出が必要
   - 再抽出条件が厳しすぎる

3. **データフローの問題**
   - クライアント側で再抽出した結果をFirestoreに保存していない
   - 再抽出結果をFirestoreに保存する機能がない
   - 毎回クライアント側で再抽出する必要があり、パフォーマンスが悪い

4. **表示ロジックの問題**
   - 「：」が表示されているが、会社名がない状態で「：」が表示されている
   - これは、`jobTitle`に「：」が含まれているか、表示ロジックに問題がある可能性

**3.8.2 修正方針**

**優先順位1: JobCardの表示ロジック修正**

1. **`displayData`の計算を修正**
   ```typescript
   // 修正前: extractedDataが依存配列に含まれていない可能性
   const displayData = useMemo(() => {
     const companyName = job.companyName || extractedData?.companyName || null;
     // ...
   }, [job.companyName, job.jobTitle, ...]);
   
   // 修正後: extractedDataを依存配列に追加
   const displayData = useMemo(() => {
     const companyName = job.companyName || extractedData?.companyName || null;
     const jobTitle = job.jobTitle || extractedData?.jobTitle || null;
     // ...
   }, [job.companyName, job.jobTitle, job.salaryBand, job.salaryMin, job.salaryMax, extractedData]);
   ```

2. **表示ロジックの改善**
   ```typescript
   // 修正前: 両方ある場合のみ「：」で区切る
   if (companyName && jobTitle) {
     return `${companyName}：${jobTitle}`;
   }
   
   // 修正後: 会社名がない場合は「：」を表示しない
   if (companyName && jobTitle) {
     return `${companyName}：${jobTitle}`;
   } else if (companyName) {
     return companyName;
   } else if (jobTitle) {
     // jobTitleに「：」が含まれている場合は除去
     return jobTitle.replace(/^[^：]*：/, '').trim();
   }
   ```

**優先順位2: 再抽出APIの改善**

1. **再抽出条件の緩和**
   ```typescript
   // 修正前: companyNameがnullのもののみ
   if (!jobData.companyName && jobData.title && jobData.content) {
     // ...
   }
   
   // 修正後: companyName、jobTitle、salaryBandのいずれかがnullまたは空文字列の場合
   const needsReExtraction = (
     !jobData.companyName || 
     !jobData.jobTitle || 
     !jobData.salaryBand
   ) && jobData.title && jobData.content;
   
   if (needsReExtraction) {
     // ...
   }
   ```

2. **再抽出結果の自動保存**
   - クライアント側で再抽出した結果をFirestoreに自動保存する機能を追加
   - `JobCard`で再抽出が成功した場合、自動的にFirestoreに保存

**優先順位3: データフローの改善**

1. **再抽出結果の自動保存機能**
   ```typescript
   // JobCard.tsx に追加
   useEffect(() => {
     if (extractedData && (extractedData.companyName || extractedData.jobTitle)) {
       // 再抽出結果をFirestoreに保存
       updateDoc(doc(db, "jobs", job.id), {
         companyName: extractedData.companyName || job.companyName,
         jobTitle: extractedData.jobTitle || job.jobTitle,
         salaryBand: extractedData.salaryBand || job.salaryBand,
         salaryMin: extractedData.salaryMin || job.salaryMin,
         salaryMax: extractedData.salaryMax || job.salaryMax,
       }).catch(err => console.error("保存エラー:", err));
     }
   }, [extractedData, job.id]);
   ```

2. **再抽出APIの改善**
   - `re-extract` APIで、`companyName`だけでなく、`jobTitle`や`salaryBand`がnullの場合も再抽出
   - 再抽出結果を確実にFirestoreに保存

**3.8.3 実装詳細**

**修正対象ファイル**:
- 修正: `components/JobCard.tsx` - `displayData`の計算と表示ロジックを修正
- 修正: `app/api/jobs/re-extract/route.ts` - 再抽出条件を緩和
- 修正: `components/JobCard.tsx` - 再抽出結果の自動保存機能を追加

**検証方法**:
1. PlaywrightでJobCardの表示を確認
2. ブラウザのコンソールで再抽出ログを確認
3. Firestoreで再抽出結果が保存されていることを確認
4. 複数のJobCardで会社名と年収帯が正しく表示されることを確認

**3.8.4 期待される結果**

修正後は以下のようになることを期待:
- JobCardで会社名が正しく表示される（例: 「株式会社マネーフォワード：プロダクトデザイナー（UI/UX）」）
- 年収帯が正しく表示される（例: 「900万円以上」）
- 再抽出結果がFirestoreに自動保存され、次回表示時に再抽出が不要になる
- パフォーマンスが改善される（再抽出が不要になるため）

---

#### **Phase 3.9: 品質基準とテスト要件の確立** 🔴 **必須遵守**

**目的**: すべての修正・機能追加時に品質基準を満たすことを保証

**3.9.1 テスト要件**

**必須テスト項目**:
1. **ログイン機能**: ログインフォームが表示され、正しい認証情報でログインできる
2. **求人リスト表示**: 保存された求人が正しく表示される（最低1件以上）
3. **会社名表示**: 80%以上の求人で会社名が正しく表示される（「会社名：役職名」形式）
4. **年収帯表示**: 70%以上の求人で年収帯が表示される
5. **URLバリデーション**: すべての求人でURLが有効である（無効なURLの場合はdisabledボタンを表示）
6. **リンククリック**: 「元ページを開く」リンクが正しく動作し、新しいタブで開ける

**テストツール**:
- Playwrightを使用したE2Eテスト
- テストスクリプト: `test-full-e2e-experience.js`

**3.9.2 品質基準**

**必須遵守事項**:
1. **URLのバリデーション**
   - すべてのURLは`http://`または`https://`で始まる必要がある
   - 無効なURLの場合は、エラーメッセージを表示またはdisabledボタンを表示
   - APIエンドポイントでURLのバリデーションを実施

2. **会社名抽出の精度**
   - freee、マネーフォワード、デロイトなどの主要企業の会社名が正しく抽出される
   - content内の「会社概要」セクションから優先的に抽出
   - URLからの推測はフォールバックとして使用

3. **UI/UXの一貫性**
   - すべてのJobCardで同じフォーマットで表示（「会社名：役職名」）
   - 無効なURLの場合は視覚的に分かりやすく表示
   - エラーメッセージは日本語で表示

4. **データの整合性**
   - 再抽出結果は自動的にFirestoreに保存される
   - 次回表示時に再抽出が不要になる（パフォーマンス向上）

**3.9.3 テスト実行のタイミング**

**必須実行タイミング**:
1. **機能追加時**: 新しい機能を追加した後は必ずE2Eテストを実行
2. **バグ修正時**: バグを修正した後は必ずE2Eテストを実行
3. **リファクタリング時**: コードをリファクタリングした後は必ずE2Eテストを実行
4. **マージ前**: mainブランチにマージする前に必ずE2Eテストを実行

**テスト実行コマンド**:
```bash
node test-full-e2e-experience.js
```

**3.9.4 テスト結果の評価基準**

**成功基準**:
- 6項目中5項目以上が成功（83%以上）
- 会社名表示: 80%以上の求人で成功
- 年収帯表示: 70%以上の求人で成功
- URLバリデーション: 100%の求人で成功

**失敗時の対応**:
- テスト結果を`test-results/full-e2e-results.json`に保存
- 失敗した項目を特定し、修正を実施
- 修正後、再度テストを実行して成功を確認

**3.9.5 実装ファイル**

**対象ファイル**:
- 新規: `test-full-e2e-experience.js` - 全体の体験テスト
- 修正: `components/JobCard.tsx` - URLバリデーションとエラーハンドリング
- 修正: `app/api/jobs/capture/route.ts` - URLバリデーション
- 修正: `lib/parsers/jobExtractor.ts` - freeeの会社名抽出ロジック改善

**検証方法**:
1. `node test-full-e2e-experience.js`を実行
2. テスト結果を確認（6項目中5項目以上が成功）
3. スクリーンショットを確認（`test-results/screenshot-full-e2e.png`）
4. テスト結果JSONを確認（`test-results/full-e2e-results.json`）

---

#### **Phase 3.10: 現在の実装状況と未解決問題** 🔴 **緊急対応が必要**

**目的**: 現在の実装状況を記録し、未解決の問題を明確化

**3.10.1 実装済みの機能**

✅ **完了済み**:
1. **JobCardの表示ロジック修正**
   - `useMemo`で`displayData`を計算し、`extractedData`を依存配列に追加
   - 再抽出結果をFirestoreに自動保存する機能を追加
   - 年収帯の表示ロジックを改善

2. **URLバリデーション**
   - `app/api/jobs/capture/route.ts`でURLのバリデーションを追加
   - `components/JobCard.tsx`で無効なURLの場合はdisabledボタンを表示

3. **会社名抽出ロジックの改善**
   - 「会社概要」セクションの直後に会社名があるパターンに対応（freee対応）
   - URLからの会社名推測機能を実装

4. **E2Eテストの実装**
   - `test-full-e2e-experience.js`で全体の体験テストを実装
   - 6項目のテスト（ログイン、求人リスト表示、会社名表示、年収帯表示、URLバリデーション、リンククリック）

**3.10.2 未解決の問題（緊急対応が必要）**

❌ **問題1: 展開したサイトのURLが適当なダミーになってしまっている**

**症状**:
- 「元ページを開く」ボタンをクリックすると、正しいURLではなく適当なダミーURLに飛ぶ
- 実際の求人ページではなく、エラーページや不正なページが表示される

**原因の可能性**:
1. Chrome拡張機能で取得したURLが正しく保存されていない
2. Firestoreに保存されているURLが古いデータまたは不正な形式
3. URLのバリデーション処理で正規化された際に問題が発生している
4. 再抽出APIでURLが上書きされている可能性

**調査が必要な箇所**:
- `chrome-extension/popup.js`の`getPageInfo()`関数で取得しているURL
- `app/api/jobs/capture/route.ts`のURLバリデーション処理
- Firestoreに保存されている実際のURLデータ
- `components/JobCard.tsx`のリンク表示ロジック

**対応方針**:
1. Firestoreに保存されているURLデータを確認
2. Chrome拡張機能で取得しているURLが正しいか確認
3. URLのバリデーション処理を見直し
4. リンククリック時の動作を確認（新しいタブで正しく開けるか）

❌ **問題2: 特定企業に最適化されたロジックによる汎用性の欠如**

**症状**:
- freeeの求人で「エンジニアリング基盤本部：データアナリスト」と表示される（正しくは「フリー株式会社：データアナリスト」）
- デロイト、マネーフォワード、freeeなどのテストケースに最適化されすぎている
- 他の求人ページで同じ問題が発生する可能性が高い

**根本原因**:
1. **特定企業名のハードコード**: `extractCompanyName`関数内に「合同会社デロイト トーマツ」などの特定企業名が直接記述されている
2. **特定パターンへの最適化**: 「会社概要\nフリー株式会社」のような特定フォーマットに最適化されている
3. **汎用性の欠如**: あらゆる求人ページに対応するための汎用的なロジックが不足している

**問題のあるコード箇所**:
- `lib/parsers/jobExtractor.ts`の`extractCompanyName`関数:
  - 114行目: `const deloittePattern = /合同会社デロイト\s+トーマツ/;` - 特定企業名のハードコード
  - 171行目: `const fullLineMatch = line.match(/合同会社デロイト\s+トーマツ/);` - 特定企業名のハードコード
  - 207行目: `const titleDeloittePattern = /合同会社デロイト\s+トーマツ/;` - 特定企業名のハードコード
  - 120-135行目: 「会社概要」セクションの処理がfreeeの形式に最適化されすぎている
- `lib/parsers/jobExtractor.ts`の`guessCompanyNameFromSlug`関数:
  - 61-66行目: 特定企業のマッピングがハードコードされている（これはフォールバック用なので許容範囲）
- `lib/parsers/jobExtractor.ts`の`extractJobTitle`関数:
  - 395行目: 「デロイトのケース対応」というコメントで特定企業に最適化されている

**対応方針**:
1. **特定企業名のハードコードを削除**: 「合同会社デロイト トーマツ」などの特定企業名パターンを削除
2. **汎用的なパターンマッチングに変更**: 法人格（株式会社、合同会社等）を含む文字列を汎用的に抽出
3. **複数行にわたる会社名の汎用的な処理**: 特定企業に依存しない、一般的な複合会社名の抽出ロジック
4. **フォールバック戦略の見直し**: URL推測やtitleからの抽出も汎用的なロジックに変更
5. **テストケース依存の排除**: テストケース（freee、デロイト、マネーフォワード）に依存しない、一般的な求人ページフォーマットに対応

**3.10.3 取り組もうとしていること**

🔄 **進行中**:

1. **URL問題の調査と修正**
   - Firestoreに保存されているURLデータの確認
   - Chrome拡張機能のURL取得処理の確認
   - URLバリデーション処理の見直し
   - リンククリック時の動作確認

2. **汎用性の欠如問題の根本的解決**
   - 特定企業名のハードコードを削除
   - 汎用的なパターンマッチングロジックへの変更
   - 複数行にわたる会社名の汎用的な処理
   - フォールバック戦略の見直し
   - テストケース依存の排除

**3.10.4 次のステップ**

**優先順位1: URL問題の解決**
1. Firestoreのデータを直接確認して、保存されているURLが正しいか確認
2. Chrome拡張機能で取得しているURLをログ出力して確認
3. URLのバリデーション処理を見直し、正規化処理が問題を引き起こしていないか確認
4. リンククリック時の動作をPlaywrightで確認

**優先順位2: 汎用性の欠如問題の根本的解決**
1. `lib/parsers/jobExtractor.ts`の`extractCompanyName`関数から特定企業名のハードコードを削除
2. 汎用的なパターンマッチングロジックに変更（法人格を含む文字列の抽出）
3. 複数行にわたる会社名の汎用的な処理を実装（特定企業に依存しない）
4. フォールバック戦略を見直し（URL推測、titleからの抽出も汎用的に）
5. テストケース（freee、デロイト、マネーフォワード）に依存しない、一般的な求人ページフォーマットに対応
6. 再抽出APIを実行してFirestoreのデータを更新
7. ブラウザで確認して正しく表示されるか確認

**3.10.5 実装ファイル**

**対象ファイル**:
- 修正: `chrome-extension/popup.js` - URL取得処理の確認と修正
- 修正: `app/api/jobs/capture/route.ts` - URLバリデーション処理の見直し
- 修正: `lib/parsers/jobExtractor.ts` - freeeの会社名抽出ロジックの修正
- 修正: `components/JobCard.tsx` - リンク表示ロジックの確認と修正
- 新規: `test-url-debug.js` - URL問題のデバッグ用テストスクリプト

**検証方法**:
1. Firestoreのデータを直接確認
2. Chrome拡張機能でURL取得処理をログ出力して確認
3. Playwrightでリンククリック時の動作を確認
4. 再抽出APIを実行してfreeeの会社名が正しく抽出されるか確認
5. ブラウザで実際の画面を確認

---

#### **Phase 3.11: SmartHR・Sansanテスト結果と抽出ロジックの課題分析** 🔴 **新規発見問題**

**目的**: SmartHRとSansanのテストケースで抽出ロジックの課題を特定し、汎用性向上の方向性を明確化

**テスト実施日**: 2026年1月12日

**テストケース**:
1. **SmartHR**: `Ops企画／BizOps（ビジネス企画統括本部）` - `reference/test-smarthr.md`
2. **Sansan**: `エンタープライズセールス［Sansan］` - `reference/test-sansan.md`

**3.11.1 テスト結果サマリー**

| 項目 | SmartHR | Sansan | 理想像（plan.md参照） |
|------|---------|--------|---------------------|
| 会社名抽出 | ❌ 失敗 | ⚠️ 部分成功（余分な文字列含む） | 80%以上の求人で成功 |
| 役職名抽出 | ✅ 成功 | ✅ 成功 | 正しく抽出 |
| 年収帯抽出 | ✅ 成功（500-700） | ✅ 成功（700-900） | 70%以上の求人で成功 |
| 年収Min/Max | ❌ 間違い（50万円/588万円） | ❌ 間違い（506万円/801万円） | 正確な値 |

**3.11.2 発見された問題と原因分析**

**問題1: SmartHRの会社名が抽出できない（freeeとは異なるパターン）**

**症状**:
- 抽出結果: `null`（抽出失敗）
- 期待値: 「SmartHR株式会社」または「株式会社SmartHR」など

**原因分析**:
- `reference/test-smarthr.md`のcontent内に「会社概要」「会社名」「企業名」などのセクションが見当たらない
- content内に法人格（株式会社、合同会社等）を含む文字列がない
- URLからの推測も機能していない（`https://smarthr.jp/recruit/jobs/ops-bizops`からは会社名を推測できない）
- titleにも会社名が含まれていない（「Ops企画／BizOps（ビジネス企画統括本部）」のみ）

**根本原因**:
- **会社名がcontent内に明示的に記載されていない**: 多くの求人サイトでは「会社概要」セクションに会社名が記載されるが、SmartHRの場合は記載されていない
- **URLからの推測が機能していない**: ドメイン名（`smarthr.jp`）から会社名を推測するロジックが不足している
- **汎用的なフォールバック戦略の不足**: content内に会社名がない場合のフォールバック戦略が不十分

**freeeとの違い（重要な発見）**:
- **freeeのケース**: `reference/test.freee.md`の250-251行目に「会社概要\nフリー株式会社」という形式で会社名が明示的に記載されている
  - 現在のロジック（「会社概要」セクションの直後に会社名があるパターン）で対応可能
- **SmartHRのケース**: content内に「会社概要」セクション自体が存在しない
  - 「会社概要」セクションを探すロジックでは対応不可能
  - **freeeと同じロジックでは抽出できない** → 別のアプローチが必要

**SmartHR特有のパターン**:
- content内に「SmartHRは...」という形で会社名が使われているが、法人格（株式会社）は含まれていない
- 「弊社は...」という表現で会社について説明しているが、会社名は明示されていない
- ドメイン名（`smarthr.jp`）から推測する必要があるが、現在のロジックでは対応していない

**必要なアプローチ**:
1. **ドメイン名からの会社名推測ロジック**: `smarthr.jp` → 「SmartHR株式会社」を推測
2. **content内の会社名パターンの拡張**: 「SmartHRは...」「弊社は...」などの表現から会社名を推測（ただし、法人格がない場合は推測が困難）
3. **URLパターンからの推測**: 自社サイトのURLパターン（`https://{company}.jp/recruit/...`）から会社名を推測
4. **外部データソースの活用**: ドメイン名と会社名のマッピングテーブル（ただし、汎用性を保つため、既知のマッピングは最小限に）

**freeeとSmartHRの比較表**:

| 項目 | freee | SmartHR | 現在のロジック対応状況 |
|------|-------|---------|---------------------|
| 「会社概要」セクション | ✅ あり（250行目） | ❌ なし | freeeのみ対応可能 |
| content内の会社名 | ✅ 「フリー株式会社」（251行目） | ❌ なし | freeeのみ対応可能 |
| 法人格の記載 | ✅ あり（株式会社） | ❌ なし | freeeのみ対応可能 |
| URLからの推測 | herp.careers経由 | 自社サイト（smarthr.jp） | 両方とも未対応 |
| 必要なロジック | 「会社概要」セクション検索 | ドメイン名からの推測 | **別のアプローチが必要** |

**問題2: Sansanの会社名に余分な文字列が含まれている**

**症状**:
- 抽出結果: `Sansan株式会社 顧客の未来をリードする`
- 期待値: `Sansan株式会社`のみ

**原因分析**:
- `reference/test-sansan.md`の108行目: `Sansan株式会社の営業とは`
- 109行目: `顧客の未来をリードする`
- 現在のロジック（`lib/parsers/jobExtractor.ts`の180-195行目）が、次の行を結合する際に除外キーワードをチェックしているが、「の営業とは」というパターンが除外キーワードに含まれていない
- 結果として、「Sansan株式会社」の次の行「顧客の未来をリードする」が結合されてしまっている

**根本原因**:
- **除外キーワードの不足**: 複数行にわたる会社名の結合処理で、除外すべきキーワード（「の営業とは」「とは」など）が不足している
- **文脈の理解不足**: 「Sansan株式会社の営業とは」という行は会社名ではなく、説明文の見出しであることを認識できていない

**問題3: 年収の抽出が間違っている**

**SmartHRのケース**:
- 抽出結果: `salaryMin: 50万円`, `salaryMax: 588万円`
- 期待値: `salaryMin: 588万円`, `salaryMax: 1,050万円`
- content内の記載: `想定年収例：588万円〜1,050万円`

**Sansanのケース**:
- 抽出結果: `salaryMin: 506万円`, `salaryMax: 801万円`
- 期待値: `salaryMin: 801万円`, `salaryMax: 1,506万円`
- content内の記載: `年収801万円～1,506万円`

**原因分析**:
- `extractSalary`関数（`lib/parsers/jobExtractor.ts`の460-565行目）が、給与セクション内のすべての数値を抽出してしまっている
- SmartHRのケース: 「月額は42万円(※4)〜75万円(※5)」という行から「42万円」と「75万円」を抽出し、さらに「588万円」も抽出して、最小値と最大値として誤って選択している
- Sansanのケース: 「年収801万の場合 月額53万（基本給42.9万＋時間外手当10.1万）」という行から「42.9万」と「10.1万」を抽出し、さらに「801万円」も抽出して、誤った組み合わせを選択している

**根本原因**:
- **セクション内の数値の優先順位が不明確**: 給与セクション内に複数の数値がある場合、どれを優先すべきかのロジックが不十分
- **「年収」キーワードの優先度が低い**: 「想定年収例：588万円〜1,050万円」のような明確な年収表記を優先すべきだが、セクション内のすべての数値を抽出してしまっている
- **説明文の数値と実際の年収の区別ができない**: 「月額42万円」のような説明文の数値と「想定年収例：588万円」のような実際の年収を区別できていない

**3.11.3 理想像（plan.md参照）との比較**

**plan.md Phase 3.9.2 品質基準**より:
- **会社名抽出の精度**: freee、マネーフォワード、デロイトなどの主要企業の会社名が正しく抽出される
- **UI/UXの一貫性**: すべてのJobCardで同じフォーマットで表示（「会社名：役職名」）

**現状とのギャップ**:
1. **SmartHR**: 会社名が抽出できない → 80%以上の求人で成功という基準を満たしていない
2. **Sansan**: 会社名に余分な文字列が含まれる → UI/UXの一貫性が損なわれている
3. **年収抽出**: 両方とも間違った値が抽出されている → 信頼性が低い

**3.11.4 改善方針**

**優先順位1: 会社名抽出の改善（SmartHRとfreeeは異なるアプローチが必要）**

**重要な発見**: SmartHRとfreeeは**異なるパターン**であり、**freeeと同じロジックでは抽出できない**

1. **SmartHRパターンへの対応（ドメイン名からの推測）**
   - `smarthr.jp` → 「SmartHR株式会社」または「株式会社SmartHR」を推測
   - 自社サイトのURLパターン（`https://{company}.jp/recruit/...`）から会社名を推測
   - ドメイン名と会社名のマッピングテーブルを拡充（ただし、汎用的なロジックを優先）
   - **freeeの「会社概要」セクション検索ロジックでは対応不可能**

2. **freeeパターンへの対応（既存ロジックの維持）**
   - 「会社概要」セクションの直後に会社名があるパターン（既存ロジックで対応可能）
   - このロジックは維持し、SmartHRパターンとは別のアプローチとして実装

3. **除外キーワードの拡充（Sansan対応）**
   - 「の営業とは」「とは」「について」などの説明文の見出しパターンを除外
   - 複数行にわたる会社名の結合処理で、より厳格な除外条件を適用

4. **文脈理解の改善（Sansan対応）**
   - 「Sansan株式会社の営業とは」のような行は、会社名ではなく説明文の見出しであることを認識
   - 次の行が説明文である可能性を考慮した結合ロジック

**実装方針**:
- SmartHRパターンとfreeeパターンは**別々のロジック**として実装
- 複数の抽出戦略を順次試行し、最初に成功したものを採用（フォールバック戦略）
- 各パターンに対応する抽出関数を分離し、メイン関数で順次呼び出す

**優先順位2: 年収抽出の改善**

1. **「年収」「想定年収」キーワードの優先度向上**
   - 「想定年収例：588万円〜1,050万円」のような明確な年収表記を最優先
   - セクション内のすべての数値を抽出するのではなく、年収キーワードに近い数値を優先

2. **説明文の数値の除外**
   - 「月額42万円(※4)」のような説明文の数値を除外
   - 括弧内の注釈（※4、※5など）を含む行の数値を除外

3. **数値の優先順位ロジック**
   - レンジパターン（「588万円〜1,050万円」）を最優先
   - 次に「年収」キーワードを含む行の数値を優先
   - 説明文の数値は最後に検討（信頼度を下げる）

**3.11.5 実装ファイル**

**対象ファイル**:
- 修正: `lib/parsers/jobExtractor.ts` - `extractCompanyName`関数の改善（ドメイン名からの推測、除外キーワードの拡充）
- 修正: `lib/parsers/jobExtractor.ts` - `extractSalary`関数の改善（年収キーワードの優先度向上、説明文の数値の除外）
- 新規: `lib/parsers/domainCompanyExtractor.ts` - ドメイン名から会社名を推測する専用モジュール（オプション）

**検証方法**:
1. SmartHRとSansanのテストケースで再テスト
2. 抽出結果を確認（会社名、年収が正しく抽出されるか）
3. UI上で表示を確認（JobCardで正しく表示されるか）
4. 他の求人サイトでも同様の問題が発生しないか確認

**3.11.6 今後のテストケース追加**

**推奨テストケース**:
- SmartHR: 会社名がcontent内に明示的に記載されていないケース
- Sansan: 会社名の後に説明文が続くケース
- その他: 様々な求人サイトのフォーマットに対応できるか確認

**テスト実施のタイミング**:
- 修正後は必ずSmartHRとSansanのテストケースで再テスト
- 新しい求人サイトのフォーマットに対応する際も、既存のテストケースで回帰テストを実施

**3.11.7 SmartHRとfreeeのパターン分類（重要な発見）**

**パターン分類の必要性**:
SmartHRとfreeeは**異なるパターン**であり、**同じロジックでは対応できない**ことが判明した。

**パターンA: freee型（「会社概要」セクションに会社名が記載されている）**
- **特徴**: content内に「会社概要」というセクションがあり、その直後に会社名が記載されている
- **例**: freee（`reference/test.freee.md`の250-251行目）
  ```
  会社概要
  フリー株式会社
  ```
- **現在のロジック**: 「会社概要」セクションの直後に会社名があるパターンに対応済み
- **抽出方法**: 正規表現で「会社概要\n株式会社XXX」パターンを検索

**パターンB: SmartHR型（content内に会社名が明示的に記載されていない）**
- **特徴**: content内に「会社概要」「会社名」などのセクションが存在しない
- **例**: SmartHR（`reference/test-smarthr.md`）
  - 「会社概要」セクションなし
  - 法人格を含む文字列なし
  - 「SmartHRは...」という形で会社名が使われているが、法人格は含まれていない
- **現在のロジック**: 対応不可（「会社概要」セクションを探すロジックでは見つからない）
- **必要な抽出方法**: 
  1. ドメイン名からの推測（`smarthr.jp` → 「SmartHR株式会社」）
  2. URLパターンからの推測（自社サイトのURLパターン）
  3. 外部データソースの活用（ドメイン名と会社名のマッピング）

**パターンC: Sansan型（会社名の後に説明文が続く）**
- **特徴**: 会社名が抽出できるが、その後に説明文が続いて結合されてしまう
- **例**: Sansan（`reference/test-sansan.md`の108-109行目）
  ```
  Sansan株式会社の営業とは
  顧客の未来をリードする
  ```
- **現在のロジック**: 部分的に対応（除外キーワードが不足）
- **必要な改善**: 除外キーワードの拡充（「の営業とは」「とは」など）

**実装戦略**:
1. **パターンA（freee型）**: 既存ロジックを維持
2. **パターンB（SmartHR型）**: 新しいロジックを追加（ドメイン名からの推測）
3. **パターンC（Sansan型）**: 既存ロジックを改善（除外キーワードの拡充）

**フォールバック戦略の順序**:
1. パターンAを試行（「会社概要」セクション検索）
2. パターンBを試行（ドメイン名からの推測）
3. パターンCを試行（法人格を含む文字列の直接抽出、除外キーワード適用）
4. URLからの推測（ATS対応、既存ロジック）
5. titleからの抽出（最後のフォールバック）

**今後の課題**:
- 各パターンに対応する抽出関数を分離し、メイン関数で順次呼び出す設計
- 新しいパターンが発見された場合、既存のパターンに影響を与えずに追加できる設計
- パターンごとの信頼度（confidence）を計算し、信頼度が低い場合はLLM補正を検討

**重要な結論**:
- **freeeと同じロジックではSmartHRの会社名は抽出できない**
- SmartHRには**別のアプローチ（ドメイン名からの推測）が必要**
- 複数のパターンに対応するため、**フォールバック戦略の実装が必須**

---

#### **Phase 4: UI改善（テーブルビュー）**

**目的**: エクセルライクな管理インターフェイスの提供

**4.1 テーブルビューコンポーネントの作成**

**実装内容**:
- 新規: `components/JobTable.tsx`

**機能**:
- 全フィールドを列として表示
- カラムのソート（クリックでソート切替）
- インライン編集（ステータス、評価、メモ等）
- 行のチェックボックス（一括操作用）

**4.2 ビュー切り替え機能**

`components/JobList.tsx` を拡張:
- カード/テーブル切り替えボタン
- 選択されたビューを localStorage に保存

**対象ファイル**:
- 新規: `components/JobTable.tsx`
- 修正: `components/JobList.tsx`
- 修正: `app/page.tsx`

---

#### **Phase 5: LLM補正（将来拡張）**

**目的**: ルールベースで抽出できなかった、または信頼度が低いフィールドをLLMで補正

**実装方針**:
- `parseConfidence < 0.5` の Job のみLLM処理
- バッチ処理（全件ではなく選択的）
- プロンプトにルールベース結果を含め、修正・補完のみ依頼

**実装内容**:
- 新規: `lib/parsers/llmCorrector.ts`
- 新規: `app/api/jobs/llm-correct/route.ts`

※ Phase 5は後回し。Phase 3完了後に検討。

---

## 実装優先順位（推奨順）

### 第1弾: 即座に価値を生む機能
1. **Phase 1.1 - 型定義の拡張** ⭐️最優先
2. **Phase 1.3 - 応募ステータスUI**
3. **Phase 1.4 - フィルタ・ソート機能**

### 第2弾: データ基盤の整備
4. **Phase 2.1 - 構造化フィールドの型追加**
5. **Phase 2.3 - 手動入力UI（オプション）**

### 第3弾: 自動化の実装
6. **Phase 3.1 - ページ種別判定**
7. **Phase 3.2 - 給与抽出**
8. **Phase 3.3 - 勤務地抽出**
9. **Phase 3.4 - その他フィールド抽出**
10. **Phase 3.5 - 抽出ロジックの改善と多様性対応** ✅ 完了（v2改善ロジック実装済み）
11. **Phase 3.6 - URLベースの会社名推測とATS対応** ✅ 完了（herp.careers、Wantedly、自社サイト対応）
12. **Phase 3.7 - 抽出ロジックのさらなる改善** 🔄 進行中
13. **Phase 3.8 - UI表示とデータフローの修正** 🔴 **最優先・緊急対応**

### 第4弾: UX改善
11. **Phase 4.1 - テーブルビュー**
12. **Phase 4.2 - ビュー切り替え**

### 第5弾: AI活用（長期）
13. **Phase 5 - LLM補正**

---

## 重要な実装ファイル一覧

### Phase 1対象
- `types/job.ts`
- `app/api/jobs/capture/route.ts`
- `components/JobCard.tsx`
- `components/JobList.tsx`
- 新規: `components/JobFilters.tsx`

### Phase 2対象
- `types/job.ts` (追加修正)
- `app/api/jobs/capture/route.ts` (追加修正)

### Phase 3対象
- 新規: `lib/parsers/` ディレクトリ配下に複数ファイル
- `app/api/jobs/capture/route.ts` (統合)

### Phase 4対象
- 新規: `components/JobTable.tsx`
- `components/JobList.tsx` (ビュー切り替え)
- `app/page.tsx`

---

## 検証方法

### Phase 1検証
1. 開発サーバー起動: `npm run dev`
2. 新しい求人を拡張機能で保存
3. ダッシュボードで以下を確認:
   - 応募ステータスのドロップダウンが表示される
   - ステータス変更がFirestoreに保存される
   - フィルタ機能が動作する
   - ソート機能が動作する

### Phase 2検証
1. 構造化フィールドが `null` で保存されることを確認
2. Firestoreコンソールでデータ構造を確認

### Phase 3検証
1. 複数の求人サイトで拡張機能を実行
2. Firestoreに保存されたデータを確認:
   - `pageType` が適切に判定されている
   - `salaryMin/Max` が抽出されている
   - `locationText` と `remoteType` が設定されている
   - `parseConfidence` と `parseIssues` が記録されている
3. 抽出精度の評価:
   - 正解データとの比較
   - 誤抽出のパターン分析

### Phase 4検証
1. テーブルビューの表示確認
2. インライン編集の動作確認
3. ビュー切り替えの動作確認

---

## リスクと対策

### リスク1: ルールベース抽出の精度
- **リスク**: サイトごとにフォーマットが異なり、抽出精度が低い
- **対策**:
  - `parseConfidence` で信頼度を記録
  - `parseIssues` でユーザーに警告
  - 手動修正機能を提供
  - Phase 5でLLM補正

### リスク2: パフォーマンス
- **リスク**: 大量の求人データでリストが重くなる
- **対策**:
  - ページネーション実装
  - 仮想スクロール（テーブルビュー）
  - Firestoreクエリの最適化

### リスク3: データマイグレーション
- **リスク**: 既存データに新フィールドが存在しない
- **対策**:
  - Firestoreは動的スキーマなので問題なし
  - フロントエンドで `null` チェック
  - 必要に応じてバッチマイグレーションスクリプト

---

## まとめ

このプランは、job-seiriプロジェクトを「タイトルと本文だけの保存ツール」から「構造化データを管理できる求人管理プラットフォーム」に進化させるロードマップです。

**核心的なアプローチ**:
1. **即効性**: Phase 1で即座にユーザー価値を提供
2. **段階的**: 小さく始めて、徐々に機能を拡張
3. **ロジック優先**: LLMに頼らず、ルールベースで最大限抽出
4. **型安全**: TypeScriptの恩恵を最大限活用

**次のアクション**:
Phase 1から順次実装を開始し、各Phaseの完了後にユーザーフィードバックを収集して方向性を調整。

---

## 📝 各ブランチの詳細作業内容

### ✅ ブランチ1: `feature/phase1-type-extension` （最優先・必須）

**目的**: 型定義とAPIを拡張し、応募管理フィールドを追加

**変更ファイル**:
1. `types/job.ts`
2. `app/api/jobs/capture/route.ts`

**作業内容**:

#### 1. `types/job.ts` の拡張
```typescript
export interface Job {
  id: string;
  url: string;
  title: string;
  content: string;
  createdAt: Date | null;

  // 既存Firestoreフィールド（型に追加）
  sourceHost: string;
  isPinned: boolean;
  isArchived: boolean;
  pageType: "job_detail" | "job_list" | "non_job" | "unknown";

  // 新規: 応募管理フィールド
  applicationStatus: "not_applied" | "applied" | "interview" | "offer" | "rejected" | "withdrawn" | null;
  applicationDate: Date | null;
  userNote: string | null;
  userRating: number | null; // 0-5
}
```

#### 2. `app/api/jobs/capture/route.ts` の修正
```typescript
// addDoc の部分に新フィールドのデフォルト値を追加
await addDoc(collection(db, "jobs"), {
  url,
  title,
  content: content || "",
  createdAt: serverTimestamp(),
  sourceHost: new URL(url).hostname,
  isPinned: false,
  isArchived: false,
  pageType: "unknown",
  // 新規追加
  applicationStatus: "not_applied",
  applicationDate: null,
  userNote: null,
  userRating: null,
});
```

**検証方法**:
1. `npm run dev` で開発サーバー起動
2. Chrome拡張で新しい求人を保存
3. Firestoreコンソールで新フィールドが保存されていることを確認
4. TypeScriptのビルドエラーがないことを確認: `npm run build`

**マージ条件**:
- TypeScriptエラーなし
- 既存機能が動作（求人の保存・表示）
- 新フィールドがFirestoreに保存される

---

### ✅ ブランチ2: `feature/phase1-status-ui`

**目的**: JobCardに応募ステータス管理UIを追加

**前提**: ブランチ1がmainにマージ済み

**変更ファイル**:
1. `components/JobCard.tsx`

**作業内容**:

展開時に以下のUIを追加:
- 応募ステータスのセレクトボックス
- メモ入力欄（textarea）
- 評価の星アイコン（0-5段階）
- 保存ボタン（Firestoreに更新）

**検証方法**:
1. 求人カードを展開
2. ステータスを変更 → Firestoreに保存されることを確認
3. メモを入力 → Firestoreに保存されることを確認
4. 評価を変更 → Firestoreに保存されることを確認

**マージ条件**:
- UI要素が表示される
- Firestore更新が正常に動作
- 既存の削除・リンク機能が正常

---

### ✅ ブランチ3: `feature/phase1-filter-sort`

**目的**: フィルタとソート機能を追加

**前提**: ブランチ1がmainにマージ済み

**変更ファイル**:
1. 新規: `components/JobFilters.tsx`
2. `components/JobList.tsx`

**作業内容**:

#### 1. `JobFilters.tsx` の作成
```typescript
// フィルタUI
- ステータスフィルタ（未応募/応募済み/面接中など）
- ピン留めのみ表示
- アーカイブ除外
```

#### 2. `JobList.tsx` の拡張
```typescript
// ソート機能
- 保存日（新しい順/古い順）
- 評価（高い順）
- 応募日

// Firestoreクエリにフィルタ・ソートを反映
```

**検証方法**:
1. フィルタで「未応募のみ」を選択 → 該当する求人のみ表示
2. ソートで「評価順」を選択 → 評価の高い順に表示
3. ピン留めした求人が最上部に表示

**マージ条件**:
- フィルタが正常に動作
- ソートが正常に動作
- パフォーマンスが許容範囲

---

### 🔧 ブランチ4以降（オプション・段階的実装）

以下のブランチはPhase 1完了後に検討:

**`feature/phase2-structured-fields`**
- 構造化フィールド（会社名、給与等）の型定義追加
- 手動入力UI（オプション）

**`feature/phase3-page-detector`**
- ページ種別判定ロジック（`lib/parsers/pageTypeDetector.ts`）
- スコアリングによる判定

**`feature/phase3-salary-extractor`**
- 給与抽出ロジック（`lib/parsers/salaryExtractor.ts`）
- ルールベースで万円・円表記から抽出

**`feature/phase3-location-extractor`**
- 勤務地抽出ロジック（`lib/parsers/locationExtractor.ts`）
- リモート可否の判定

---

## 🚀 推奨開始方法

### ステップ1: 最初のブランチから開始
```bash
cd /Users/satonodoka/Documents/job-seiri
git checkout -b feature/phase1-type-extension
```

このブランチで `types/job.ts` と `app/api/jobs/capture/route.ts` を編集。

### ステップ2: 動作確認
```bash
npm run dev
# Chrome拡張でテスト
npm run build  # TypeScriptエラーチェック
```

### ステップ3: mainにマージ
```bash
git checkout main
git merge feature/phase1-type-extension
git push origin main
```

### ステップ4: 次のブランチへ
```bash
git checkout -b feature/phase1-status-ui
# 次の作業を開始
```

---

## 💡 並列開発のヒント

複数のターミナルで並列作業する場合:

**ターミナル1** (依存なし):
```bash
git checkout -b feature/phase1-type-extension
```

**ターミナル2** (ターミナル1完了後):
```bash
git checkout main
git pull
git checkout -b feature/phase1-status-ui
```

**ターミナル3** (ターミナル1完了後):
```bash
git checkout main
git pull
git checkout -b feature/phase1-filter-sort
```

---

このプランで、小さく確実に進められます！

---

## 🔧 現状の問題点と修正作業（2026-01-14）

### 実装状況の分析結果

**現状**: plan.mdの段階的実装プランを大きく逸脱し、Phase 2/3の機能（構造化フィールド抽出、フィルタリング）を先行実装したが、**Phase 1の重要機能を未実装**のまま。

#### ✅ 実装済み（計画より先行）
- 構造化フィールド（companyName, jobTitle, salary等）の抽出ロジック（`lib/parsers/jobExtractor.ts`）
- JobFiltersコンポーネント（jobType, industry, salaryBandでフィルタリング）
- ソート機能（日付、社名、役職、年収）
- JobCardの拡張表示（バッジ、構造化セクション）
- クライアント側自動再抽出機能
- Playwright導入

#### ❌ 未実装（Phase 1で最優先すべきだった機能）
1. **応募ステータス管理**
   - `applicationStatus` フィールド（未応募/応募済み/面接中/オファー/不採用/辞退）
   - `applicationDate` フィールド
   - `userNote` フィールド（メモ）
   - `userRating` フィールド（評価1-5）
   - 上記を管理するUI（ドロップダウン、テキストエリア、星評価）

2. **ピン留め・アーカイブ機能のUI**
   - `isPinned`, `isArchived` はFirestoreに存在するが、UIで操作不可
   - ピン留めした求人を最上部に表示する機能
   - アーカイブした求人を非表示にする機能

### 🚨 Critical Issues（緊急修正必要）

#### Issue 1: Auto-save infinite loop risk in JobCard.tsx
**場所**: `components/JobCard.tsx` 行72-91

**問題点**:
```typescript
useEffect(() => {
  if (extractedData && ...) {
    updateDoc(doc(db, "jobs", job.id), { ... })
    // ...
  }
}, [extractedData, job.id, job.companyName, job.jobTitle, ...]);
```
- 依存配列に `job.companyName`, `job.jobTitle` 等を含むため、Firestore更新→再レンダリング→再度useEffect発火のリスク
- 重複保存の可能性

**修正内容（✅ 完了）**:
```typescript
const [hasSaved, setHasSaved] = useState(false);

useEffect(() => {
  if (!hasSaved && extractedData && ...) {
    updateDoc(...)
    .then(() => {
      setHasSaved(true); // 重複保存を防止
    });
  }
}, [extractedData, hasSaved, ...]);
```

#### Issue 2: Automatic extraction on page load (performance risk)
**場所**: `components/JobCard.tsx` 行24-70

**問題点**:
- すべてのJobCardが`useEffect`で自動的に抽出APIを呼び出し
- 50件の求人がある場合、ページロード時に最大50回のAPI呼び出し
- レート制限なし、バッチ処理なし

**修正方針（未実装）**:
1. **オプションA**: 自動抽出を無効化し、「再抽出」ボタンを追加
   ```typescript
   // useEffectを削除
   const handleReExtract = async () => {
     // 手動で抽出APIを呼び出し
   };

   // UI: <button onClick={handleReExtract}>再抽出</button>
   ```

2. **オプションB**: バッチ処理を実装
   - JobList側で「全件再抽出」ボタン
   - 5件ずつ順次処理、プログレスバー表示
   - レート制限付き（例: 500ms間隔）

### 📋 残りの修正タスク（優先順）

#### 1. 自動抽出の無効化（2-3時間）
- [ ] JobCard.tsxの自動抽出useEffectを削除
- [ ] 「再抽出」ボタンをJobCard展開時に追加
- [ ] ボタンクリックで手動抽出を実行
- [ ] ローディング状態の表示

#### 2. Phase 1: 応募ステータス管理の実装（5-6時間）

**Step 2.1: 型定義の拡張**
```typescript
// types/job.ts に追加
export interface Job {
  // ...existing fields...

  // 応募管理フィールド
  applicationStatus: "not_applied" | "applied" | "interview" | "offer" | "rejected" | "withdrawn" | null;
  applicationDate: Date | null;
  userNote: string | null;
  userRating: number | null; // 1-5
}
```

**Step 2.2: APIルートの更新**
```typescript
// app/api/jobs/capture/route.ts
await addDoc(collection(db, "jobs"), {
  // ...existing fields...
  applicationStatus: "not_applied",
  applicationDate: null,
  userNote: null,
  userRating: null,
});
```

**Step 2.3: JobCardにUI追加**
```typescript
// components/JobCard.tsx の展開時セクションに追加
<div className="mb-4">
  <label>応募ステータス</label>
  <select value={job.applicationStatus || "not_applied"} onChange={handleStatusChange}>
    <option value="not_applied">未応募</option>
    <option value="applied">応募済み</option>
    <option value="interview">面接中</option>
    <option value="offer">オファー</option>
    <option value="rejected">不採用</option>
    <option value="withdrawn">辞退</option>
  </select>
</div>

<div className="mb-4">
  <label>メモ</label>
  <textarea value={job.userNote || ""} onChange={handleNoteChange} />
</div>

<div className="mb-4">
  <label>評価</label>
  {[1,2,3,4,5].map(star => (
    <button key={star} onClick={() => handleRatingChange(star)}>
      {star <= (job.userRating || 0) ? "★" : "☆"}
    </button>
  ))}
</div>
```

**Step 2.4: JobFiltersにステータスフィルタ追加**
```typescript
// components/JobFilters.tsx
const [statusFilter, setStatusFilter] = useState<string | null>(null);

// UI
<select value={statusFilter || ""} onChange={...}>
  <option value="">すべて</option>
  <option value="not_applied">未応募</option>
  <option value="applied">応募済み</option>
  {/* ... */}
</select>
```

#### 3. Phase 1: ピン留め・アーカイブUI（2-3時間）

**Step 3.1: JobCardにピン/アーカイブボタン追加**
```typescript
// components/JobCard.tsx のヘッダー部分
<button onClick={handleTogglePin}>
  {job.isPinned ? "📌" : "📍"}
</button>
<button onClick={handleToggleArchive}>
  {job.isArchived ? "📦" : "🗃️"}
</button>
```

**Step 3.2: JobListでピン留めを最上部に表示**
```typescript
// components/JobList.tsx
const sortedJobs = useMemo(() => {
  return [...filteredJobs].sort((a, b) => {
    // ピン留めを最優先
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // その後、選択されたソート条件で並べ替え
    // ...
  });
}, [filteredJobs, sortField, sortOrder]);
```

**Step 3.3: JobFiltersにアーカイブフィルタ追加**
```typescript
<label>
  <input type="checkbox" checked={hideArchived} onChange={...} />
  アーカイブを非表示
</label>
```

#### 4. テストの整理（2-3時間）
- [ ] `tests/e2e/` ディレクトリを作成
- [ ] ルートの `test-*.js` ファイルを移動
- [ ] `playwright.config.ts` を作成
- [ ] `package.json` に `"test": "playwright test"` を追加

### 📊 作業時間見積もり

| タスク | 見積もり時間 |
|--------|------------|
| 1. 自動抽出の無効化 | 2-3時間 |
| 2. 応募ステータス管理 | 5-6時間 |
| 3. ピン留め・アーカイブUI | 2-3時間 |
| 4. テストの整理 | 2-3時間 |
| **合計** | **11-15時間** |

### 🎯 推奨作業順序

1. **今すぐ**: Issue 1（auto-save loop）の修正 ← ✅ **完了**
2. **次**: Issue 2（自動抽出の無効化） ← **これから**
3. **その後**: Phase 1機能の実装（応募ステータス → ピン留め）
4. **最後**: テスト整理

### 💾 現在の作業状態（中断ポイント）

**完了**:
- ✅ JobCard.tsxの`hasSaved`フラグ追加（行22）
- ✅ auto-saveのuseEffectを修正（行72-91）

**次に実施すべき作業**:
1. JobCard.tsxの自動抽出useEffect（行24-70）を削除
2. 「再抽出」ボタンを追加（JobCard展開時のボタンエリア）
3. 手動抽出ハンドラーを実装
