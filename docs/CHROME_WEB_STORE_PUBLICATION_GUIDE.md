# Chrome Web Store 公開ガイド

## 拡張機能の基本情報

### 1. 拡張機能名
- **日本語**: 求人ブックマーク
- **英語**: Job Bookmark（または求人ブックマークのローマ字表記）

### 2. バージョン
- **現在のバージョン**: 1.0.0

### 3. 簡潔な説明（20〜30語程度）

**日本語（推奨）:**
```
求人ページをワンクリックで保存し、AIで自動抽出した求人情報を管理できる拡張機能です。
```

**英語:**
```
Save job postings with one click and manage job information automatically extracted by AI.
```

**文字数**: 日本語 42文字、英語 89文字（制限: 132文字以内）

### 4. 詳細説明（120〜300語程度）

**日本語版（推奨）:**

```
【求人ブックマーク】

求人ページを効率的に保存・管理するためのChrome拡張機能です。

【主な機能】
✅ ワンクリックで求人ページを保存
✅ AI（Gemini）による自動的な求人情報抽出
✅ Webダッシュボードで保存した求人を一覧表示・検索
✅ 年収、勤務地、雇用形態などの情報を自動抽出

【使用方法】
1. 求人詳細ページで拡張機能アイコンをクリック
2. 「この求人を保存」ボタンをクリック
3. Webダッシュボード（https://job-seiri.netlify.app）で保存した求人を確認

【データの取り扱い】
この拡張機能は、ユーザーが「この求人を保存」ボタンをクリックした時のみ、以下のデータを送信します：
- ページのURL
- ページタイトル
- ページ本文（最大20,000文字）

送信されたデータは、AI（Google Gemini API）で求人情報を抽出し、Firebaseに保存されます。バックグラウンドでの自動送信は行いません。

ユーザーは、Webダッシュボードからいつでもデータを削除できます。詳細はプライバシーポリシーをご確認ください。

【権限について】
- activeTab: 現在表示中のページの情報を取得するために必要です
- scripting: ページから求人情報を抽出するために必要です
- storage: 認証トークンなどの設定情報を保存するために必要です

【プライバシーポリシー】
https://job-seiri.netlify.app/privacy-policy

【サポート】
https://job-seiri.netlify.app/support
```

**英語版:**

```
【求人ブックマーク - Job Bookmark】

A Chrome extension for efficiently saving and managing job postings.

【Key Features】
✅ Save job postings with one click
✅ Automatic job information extraction using AI (Gemini)
✅ View and search saved job postings on the web dashboard
✅ Automatically extract information such as salary, location, and employment type

【How to Use】
1. Click the extension icon on a job detail page
2. Click the "Save this job" button
3. View saved job postings on the web dashboard (https://job-seiri.netlify.app)

【Data Handling】
This extension only sends the following data when you click the "Save this job" button:
- Page URL
- Page title
- Page content (up to 20,000 characters)

The sent data is processed by AI (Google Gemini API) to extract job information and saved to Firebase. No automatic background transmission is performed.

Users can delete their data at any time from the web dashboard. For details, please see the Privacy Policy.

【Permissions】
- activeTab: Required to access information from the currently displayed page
- scripting: Required to extract job information from the page
- storage: Required to save settings such as authentication tokens

【Privacy Policy】
https://job-seiri.netlify.app/privacy-policy

【Support】
https://job-seiri.netlify.app/support
```

**文字数**: 日本語 約650文字、英語 約1,200文字（制限: 16,000文字以内）

### 5. アイコン画像

**必須サイズ:**
- **128x128 pixels** (PNG形式、必須)
- **48x48 pixels** (PNG形式、推奨)
- **16x16 pixels** (PNG形式、推奨)

**ファイル名例:**
- `icon-128.png`
- `icon-48.png`
- `icon-16.png`

**仕様:**
- 背景: 透明または単色
- 形式: PNG（推奨）またはJPEG
- ファイルサイズ: 各画像128KB以下

### 6. スクリーンショット

**必須:**
- **最小1枚、最大5枚**
- **推奨サイズ**: 1280x800 pixels または 640x400 pixels
- **形式**: PNGまたはJPEG
- **ファイルサイズ**: 各画像8MB以下

**推奨スクリーンショット順序:**
1. 拡張機能のポップアップ画面（保存ボタン表示）
2. Webダッシュボードの一覧画面
3. 求人詳細画面（抽出された情報表示）
4. フィルター機能の画面（オプション）
5. アーカイブ機能の画面（オプション）

**ファイル名例:**
- `screenshot-1-popup.png`
- `screenshot-2-dashboard.png`
- `screenshot-3-detail.png`

## Chrome Web Store Developer Dashboard 入力事項

### 1. 基本情報

#### タイトル（Name）
- **日本語**: 求人ブックマーク
- **英語**: Job Bookmark（または求人ブックマークのローマ字表記）
- **文字数制限**: 45文字以内

#### カテゴリー（Category）
- **推奨**: Productivity（生産性）
- **代替**: Business（ビジネス）

#### 言語（Language）
- **日本語**: Japanese
- **英語**: English（US）

#### 地域（Region）
- **推奨**: すべての地域（All regions）

### 2. 説明文

#### Short Description（簡潔な説明）
**日本語:**
```
求人ページをワンクリックで保存し、AIで自動抽出した求人情報を管理できる拡張機能です。
```

**英語:**
```
Save job postings with one click and manage job information automatically extracted by AI.
```

**文字数制限**: 132文字以内

#### Detailed Description（詳細説明）
上記の「4. 詳細説明」を参照

**文字数制限**: 16,000文字以内

### 3. サポート情報

#### Support URL（サポートURL）
```
https://job-seiri.netlify.app/support
```

#### Privacy Policy URL（プライバシーポリシーURL）
```
https://job-seiri.netlify.app/privacy-policy
```

**必須**: データを収集する拡張機能の場合、プライバシーポリシーURLは必須です。

#### Homepage URL（ホームページURL）
```
https://job-seiri.netlify.app
```

### 4. 権限説明文（Permissions Justification）

#### activeTab
**日本語:**
```
現在表示中のページから求人情報を抽出するために必要です。ユーザーが拡張機能アイコンをクリックした時のみ、そのタブの情報にアクセスします。
```

**英語:**
```
Required to extract job information from the currently displayed page. Only accesses tab information when the user clicks the extension icon.
```

#### scripting
**日本語:**
```
ページから求人情報を抽出するために、ページ内でスクリプトを実行する必要があります。
```

**英語:**
```
Required to execute scripts within the page to extract job information.
```

#### storage
**日本語:**
```
認証トークンなどの設定情報をローカルに保存するために必要です。
```

**英語:**
```
Required to save settings such as authentication tokens locally.
```

### 5. Data Safety（データの取り扱い）

#### データ収集
- **収集する**: はい

#### 収集するデータタイプ
- **URL**: はい
- **テキスト**: はい（ページタイトル、本文）

#### データの使用目的
- **アプリ機能**: はい（求人情報の保存・管理）
- **分析**: はい（AIによる求人情報抽出）

#### データの共有
- **共有する**: はい
  - **Google Gemini API**: 分析目的
  - **Firebase**: データ保存

#### データのセキュリティ
- **データは暗号化されている**: はい

#### データの削除
- **ユーザーがデータを削除できる**: はい

#### データの取り扱いに関する説明文

**日本語:**
```
この拡張機能は、ユーザーが「この求人を保存」ボタンをクリックした時のみ、ページのURL、タイトル、本文を収集します。収集したデータは、AI（Google Gemini API）で求人情報を抽出し、Firebaseに保存されます。バックグラウンドでの自動送信は行いません。ユーザーは、Webダッシュボードからいつでもデータを削除できます。
```

**英語:**
```
This extension only collects page URL, title, and content when the user clicks the "Save this job" button. Collected data is processed by AI (Google Gemini API) to extract job information and saved to Firebase. No automatic background transmission is performed. Users can delete their data at any time from the web dashboard.
```

## 必須アセットの仕様

### アイコン
- **サイズ**: 128x128 pixels（必須）
- **形式**: PNG（推奨）
- **背景**: 透明または単色
- **ファイルサイズ**: 128KB以下

### スクリーンショット
- **枚数**: 最小1枚、最大5枚
- **サイズ**: 1280x800 pixels または 640x400 pixels
- **形式**: PNGまたはJPEG
- **ファイルサイズ**: 各画像8MB以下

### その他の画像
- **Promotional Images（プロモーション画像）**: オプション
  - サイズ: 440x280 pixels
  - 形式: PNGまたはJPEG

## 審査で差し戻されやすいポイントと回避策

### 1. 権限の説明不足
**問題**: `<all_urls>`などの広範囲な権限の説明が不十分
**回避策**: 
- ✅ 既に対応済み: `host_permissions`を削除し、`activeTab`のみ使用
- 権限説明文で「ユーザーがクリックした時のみ」と明記

### 2. データ収集の説明不足
**問題**: データ収集の目的・方法・削除方法の説明が不十分
**回避策**:
- ✅ 既に対応済み: プライバシーポリシーを作成
- Data Safetyセクションで詳細に記載
- 「ボタンクリック時のみ送信」と明記

### 3. プライバシーポリシーの不備
**問題**: プライバシーポリシーURLが無効、または内容が不十分
**回避策**:
- ✅ 既に対応済み: プライバシーポリシーを作成
- 公開前にURLがアクセス可能か確認
- 必須項目（収集情報、目的、第三者提供、削除方法）を記載

### 4. スクリーンショットの不備
**問題**: スクリーンショットが不十分、または拡張機能の機能が分からない
**回避策**:
- 最低3枚のスクリーンショットを用意
- ポップアップ、ダッシュボード、詳細画面を含める
- 各スクリーンショットに説明文を追加

### 5. 説明文の不備
**問題**: 説明文が不十分、または誤解を招く表現
**回避策**:
- 機能を具体的に説明
- 「AIで抽出」など技術的な説明を含める
- データ送信のタイミングを明記

### 6. 動作不良
**問題**: 拡張機能が正常に動作しない
**回避策**:
- 公開前に十分なテストを実施
- 各種求人サイトで動作確認
- エラーハンドリングを適切に実装

## 公開後の更新手順

### 1. バージョン番号の更新

#### manifest.json
```json
{
  "manifest_version": 3,
   "name": "求人ブックマーク",
  "version": "1.0.1",  // バージョンを更新
  ...
}
```

#### バージョン番号の規則
- **メジャーバージョン** (1.0.0 → 2.0.0): 大きな機能追加・変更
- **マイナーバージョン** (1.0.0 → 1.1.0): 機能追加・改善
- **パッチバージョン** (1.0.0 → 1.0.1): バグ修正・軽微な改善

### 2. 更新コメント（Release Notes）

#### 日本語版
```
【バージョン 1.0.1】
- バグ修正: 特定のサイトで情報が取得できない問題を修正
- 改善: エラーメッセージをより分かりやすく改善
```

#### 英語版
```
【Version 1.0.1】
- Bug fix: Fixed issue where information could not be retrieved on certain sites
- Improvement: Made error messages more user-friendly
```

**文字数制限**: 500文字以内（推奨: 200文字程度）

### 3. 更新手順

1. **コードの変更**
   - `manifest.json`のバージョンを更新
   - 変更内容をコミット・プッシュ

2. **ZIPファイルの作成**
   ```bash
   cd chrome-extension
   zip -r ../job-seiri-v1.0.1.zip . -x "*.git*" "*.DS_Store" "config.js"
   ```

3. **Chrome Web Store Developer Dashboard で更新**
   - 「パッケージをアップロード」をクリック
   - 新しいZIPファイルをアップロード
   - 更新コメントを入力
   - 「公開の変更を送信」をクリック

4. **審査待ち**
   - 通常1〜3営業日で審査が完了
   - 審査結果はメールで通知

## チェックリスト

### 公開前の確認事項

- [ ] manifest.jsonのバージョンが正しいか
- [ ] アイコン画像（128x128）が用意されているか
- [ ] スクリーンショット（最低1枚）が用意されているか
- [ ] プライバシーポリシーURLがアクセス可能か
- [ ] サポートURLがアクセス可能か
- [ ] 説明文（Short/Long Description）が入力されているか
- [ ] 権限説明文が入力されているか
- [ ] Data Safetyセクションが正しく入力されているか
- [ ] ZIPファイルに不要なファイルが含まれていないか（.git、node_modules等）
- [ ] 拡張機能が正常に動作するか（テスト済み）

### ZIPファイル作成時の除外ファイル

以下のファイルはZIPに含めないでください：
- `.git/` ディレクトリ
- `node_modules/` ディレクトリ
- `.DS_Store` ファイル
- `config.js`（機密情報を含む可能性があるため）
- `*.log` ファイル
- `README.md`（オプション）

## 参考リンク

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome拡張機能の公開ガイド](https://developer.chrome.com/docs/webstore/publish)
- [Manifest V3移行ガイド](https://developer.chrome.com/docs/extensions/mv3/intro/)
