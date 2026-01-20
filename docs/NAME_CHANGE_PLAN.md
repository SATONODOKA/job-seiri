# プロダクト名変更プラン: "Job Seiri" → "求人ブックマーク"

## 変更方針

- **変更する**: ユーザーに見える表示名のみ
- **変更しない**: Firestoreのコレクション名、APIルート、環境変数、ファイル名、コード内の変数名など

## 変更対象ファイル

### 1. Webアプリ側（app/）

#### app/page.tsx
- `"Job Seiri"` → `"求人ブックマーク"`
- サブタイトル「求人ブックマーク」はそのまま

#### app/layout.tsx
- `title: "Job Seiri - 求人ブックマーク"` → `title: "求人ブックマーク"`
- `description`はそのまま（既に適切）

#### app/privacy-policy/page.tsx
- `title: "プライバシーポリシー - Job Seiri"` → `title: "プライバシーポリシー - 求人ブックマーク"`
- `description: "Job Seiriのプライバシーポリシー"` → `description: "求人ブックマークのプライバシーポリシー"`
- 本文内の`"Job Seiri（以下「本サービス」）"` → `"求人ブックマーク（以下「本サービス」）"`

#### app/support/page.tsx
- `title: "サポート - Job Seiri"` → `title: "サポート - 求人ブックマーク"`
- `description: "Job Seiriのサポートページ"` → `description: "求人ブックマークのサポートページ"`

### 2. コンポーネント側（components/）

#### components/LoginForm.tsx
- `"Job Seiri"` → `"求人ブックマーク"`（2箇所）
- `"ブラウザに Job Seiri 拡張機能を追加します。"` → `"ブラウザに 求人ブックマーク 拡張機能を追加します。"`

### 3. 拡張機能側（chrome-extension/）

#### chrome-extension/popup.html
- `<h1>Job Seiri</h1>` → `<h1>求人ブックマーク</h1>`

#### chrome-extension/manifest.json
- `"name": "Job Seiri"` → `"name": "求人ブックマーク"`
- `"description"`はそのまま（既に適切）

### 4. ドキュメント側（docs/）

#### docs/STORE_DESCRIPTION.md
- `【Job Seiri - 求人ブックマーク管理ツール】` → `【求人ブックマーク】`
- その他の"Job Seiri"の記載も変更

#### docs/CHROME_WEB_STORE_PUBLICATION_GUIDE.md
- 拡張機能名の記載を変更
- ストア掲載文の内容を更新

#### docs/PRIVACY_POLICY.md
- `Job Seiri（以下「本サービス」）` → `求人ブックマーク（以下「本サービス」）`

#### docs/STORE_SUBMISSION_CHECKLIST.md
- タイトルなどの記載を更新

## 変更しない箇所（重要）

以下の箇所は変更しません：

- **URL**: `kyujin-bookmark.netlify.app`（新しいURL）
- **Firestoreコレクション名**: `jobs`（そのまま）
- **APIルート**: `/api/jobs/capture`（そのまま）
- **環境変数名**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID=job-seiri`（そのまま）
- **ファイル名**: `job-seiri`（そのまま）
- **フォルダ名**: `job-seiri`（そのまま）
- **コード内の変数名、関数名**: すべてそのまま
- **Firebaseプロジェクト名**: `job-seiri`（そのまま）

## 実装手順

1. Webアプリ側の変更（app/, components/）
2. 拡張機能側の変更（chrome-extension/）
3. ドキュメント側の変更（docs/）
4. 動作確認
5. コミット・プッシュ

## 動作確認項目

- [ ] Webアプリのタイトルが「求人ブックマーク」になっているか
- [ ] 拡張機能のポップアップに「求人ブックマーク」と表示されるか
- [ ] プライバシーポリシーページが正常に表示されるか
- [ ] サポートページが正常に表示されるか
- [ ] ログインフォームに「求人ブックマーク」と表示されるか
- [ ] エラーが発生していないか（コンソール確認）

## 注意事項

- URLやAPIルートは変更しないため、既存の機能に影響はありません
- Firestoreのコレクション名も変更しないため、既存データに影響はありません
- コード内の変数名も変更しないため、エラーのリスクは低いです
