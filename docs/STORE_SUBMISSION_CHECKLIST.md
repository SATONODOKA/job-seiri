# Chrome Web Store申請 最終チェックリスト

## ✅ 完了済み項目

### 実装
- [x] manifest.json: `host_permissions`削除、`storage`権限追加
- [x] popup.js: `htmlStructure`送信停止、認証トークン対応、注入不可ページの例外処理
- [x] API: 認証、レート制限、求人ページ判定、ログマスキング実装
- [x] レート制限: 30件/分に緩和（一気に15件保存可能）
- [x] Firestore接続問題: 解決済み

### ドキュメント
- [x] プライバシーポリシー作成 (`docs/PRIVACY_POLICY.md`)
- [x] ストア掲載文作成 (`docs/STORE_DESCRIPTION.md`)
- [x] 公開ガイド作成 (`docs/CHROME_WEB_STORE_PUBLICATION_GUIDE.md`)
- [x] 作業チェックリスト作成 (`docs/PRE_PUBLICATION_TASKS.md`)

### Webアプリ
- [x] プライバシーポリシーページ (`app/privacy-policy/page.tsx`)
- [x] サポートページ (`app/support/page.tsx`)

---

## ⚠️ 申請前に準備が必要な項目

### 1. アイコン画像（必須）

**要件**:
- サイズ: 128x128 pixels
- 形式: PNG（推奨）
- ファイル名: `icon-128.png`
- 配置場所: `chrome-extension/icon-128.png`

**現状**: ❌ 未作成

**作業**:
1. アイコン画像を作成（Figma、Canva等を使用）
2. `chrome-extension/icon-128.png`として保存
3. `manifest.json`に追加（オプション）:
   ```json
   {
     "icons": {
       "128": "icon-128.png"
     }
   }
   ```

### 2. スクリーンショット（必須: 最低1枚、推奨3枚以上）

**要件**:
- サイズ: 1280x800 pixels または 640x400 pixels
- 形式: PNGまたはJPEG
- 枚数: 最低1枚、最大5枚

**推奨スクリーンショット**:
1. 拡張機能のポップアップ画面（保存ボタン表示）
2. Webダッシュボードの一覧画面
3. 求人詳細画面（抽出された情報表示）

**現状**: ❌ 未作成

**作業**:
1. 各画面のスクリーンショットを撮影
2. ファイル名を整理（例: `screenshot-1-popup.png`）

### 3. ZIPファイルの作成

**要件**:
- `chrome-extension`フォルダをZIP化
- 不要なファイルを除外（`.git`、`config.js`等）

**作業**:
```bash
cd chrome-extension
zip -r ../job-seiri-v1.0.0.zip . \
  -x "*.git*" \
  -x "*node_modules*" \
  -x "*.DS_Store" \
  -x "config.js" \
  -x "*.log"
```

**現状**: ⏳ アイコン・スクリーンショット準備後に作成

### 4. Netlify環境変数の確認

**必須環境変数**:
- [x] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [x] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [x] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [x] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [x] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [x] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [x] `GEMINI_API_KEY`

**公開後に設定**:
- [ ] `EXTENSION_ID`（Chrome Web Store公開後に拡張機能IDを取得して設定）

**現状**: ✅ 必須環境変数は設定済み（想定）

### 5. Firestore Security Rulesの確認

**現状**: ✅ 設定済み（想定）

**確認事項**:
- [ ] 認証済みユーザーがデータを読み取れるか
- [ ] `anonymous`のデータも読み取れるか（拡張機能から保存したデータ用）

### 6. 動作テスト

**テスト項目**:
- [ ] 拡張機能が正常に動作するか
- [ ] 複数の求人サイトで動作確認（リクルート、マイナビ、doda等）
- [ ] 一気に15件保存できるか
- [ ] Webアプリで保存した求人が正常に表示されるか
- [ ] 削除・アーカイブ機能が正常に動作するか
- [ ] プライバシーポリシーページが表示されるか
- [ ] サポートページが表示されるか

**現状**: ⏳ 実施が必要

---

## 📋 Chrome Web Store Developer Dashboard 入力項目

### 基本情報

- **タイトル**: Job Seiri
- **カテゴリー**: Productivity（生産性）
- **言語**: Japanese, English（US）
- **地域**: すべての地域

### 説明文

**Short Description**（132文字以内）:
```
求人ページをワンクリックで保存し、AIで自動抽出した求人情報を管理できる拡張機能です。
```

**Long Description**（16,000文字以内）:
`docs/STORE_DESCRIPTION.md`の内容を使用

### サポート情報

- **Support URL**: https://job-seiri.netlify.app/support
- **Privacy Policy URL**: https://job-seiri.netlify.app/privacy-policy
- **Homepage URL**: https://job-seiri.netlify.app

### 権限説明文

**activeTab**:
```
現在表示中のページから求人情報を抽出するために必要です。ユーザーが拡張機能アイコンをクリックした時のみ、そのタブの情報にアクセスします。
```

**scripting**:
```
ページから求人情報を抽出するために、ページ内でスクリプトを実行する必要があります。
```

**storage**:
```
認証トークンなどの設定情報をローカルに保存するために必要です。
```

### Data Safety（データの取り扱い）

**収集するデータタイプ**:
- URL: はい
- テキスト: はい（ページタイトル、本文）

**データの使用目的**:
- アプリ機能: はい
- 分析: はい（AIによる求人情報抽出）

**データの共有**:
- 共有する: はい
  - Google Gemini API: 分析目的
  - Firebase: データ保存

**データのセキュリティ**:
- データは暗号化されている: はい

**データの削除**:
- ユーザーがデータを削除できる: はい

**データの取り扱いに関する説明文**:
```
この拡張機能は、ユーザーが「この求人を保存」ボタンをクリックした時のみ、ページのURL、タイトル、本文を収集します。収集したデータは、AI（Google Gemini API）で求人情報を抽出し、Firebaseに保存されます。バックグラウンドでの自動送信は行いません。ユーザーは、Webダッシュボードからいつでもデータを削除できます。
```

---

## 🚀 申請手順

### Step 1: 事前準備

1. [ ] アイコン画像（128x128）を作成・配置
2. [ ] スクリーンショット（最低1枚）を撮影
3. [ ] 動作テストを実施
4. [ ] Firestore Security Rulesを確認

### Step 2: ZIPファイルの作成

1. [ ] `chrome-extension`フォルダをZIP化
2. [ ] 不要なファイルを除外（`.git`、`config.js`等）
3. [ ] ZIPファイルの内容を確認

### Step 3: Chrome Web Store Developer Dashboardで申請

1. [ ] https://chrome.google.com/webstore/devconsole にアクセス
2. [ ] 「新しいアイテム」をクリック
3. [ ] ZIPファイルをアップロード
4. [ ] 基本情報を入力（タイトル、カテゴリー、言語等）
5. [ ] 説明文を入力（Short/Long Description）
6. [ ] 権限説明文を入力
7. [ ] Data Safetyセクションを入力
8. [ ] スクリーンショットをアップロード
9. [ ] プライバシーポリシーURLを入力
10. [ ] サポートURLを入力
11. [ ] 「公開の変更を送信」をクリック

### Step 4: 審査待ち

- 通常1〜3営業日で審査が完了
- 審査結果はメールで通知

### Step 5: 公開後

1. [ ] 拡張機能IDを取得
2. [ ] Netlify環境変数に`EXTENSION_ID`を設定
3. [ ] 公開後の動作確認を実施
4. [ ] エラーログを監視

---

## 📝 申請時に使用する文言（コピー用）

### Short Description

```
求人ページをワンクリックで保存し、AIで自動抽出した求人情報を管理できる拡張機能です。
```

### Long Description

`docs/STORE_DESCRIPTION.md`の内容をそのまま使用

### 権限説明文

**activeTab**:
```
現在表示中のページから求人情報を抽出するために必要です。ユーザーが拡張機能アイコンをクリックした時のみ、そのタブの情報にアクセスします。
```

**scripting**:
```
ページから求人情報を抽出するために、ページ内でスクリプトを実行する必要があります。
```

**storage**:
```
認証トークンなどの設定情報をローカルに保存するために必要です。
```

### Data Safety説明文

```
この拡張機能は、ユーザーが「この求人を保存」ボタンをクリックした時のみ、ページのURL、タイトル、本文を収集します。収集したデータは、AI（Google Gemini API）で求人情報を抽出し、Firebaseに保存されます。バックグラウンドでの自動送信は行いません。ユーザーは、Webダッシュボードからいつでもデータを削除できます。
```

---

## ⚠️ 注意事項

### 申請前に必ず確認

1. **アイコン画像が準備できているか**
2. **スクリーンショットが準備できているか**
3. **プライバシーポリシーURLがアクセス可能か**
4. **サポートURLがアクセス可能か**
5. **動作テストが完了しているか**

### 審査で差し戻されやすいポイント

1. **権限の説明不足** → 権限説明文を詳細に記載 ✅
2. **データ収集の説明不足** → Data Safetyセクションで詳細に記載 ✅
3. **プライバシーポリシーの不備** → プライバシーポリシーを作成済み ✅
4. **スクリーンショットの不備** → 準備が必要 ⚠️

---

## 📞 次のステップ

1. **アイコン画像を作成**（最優先）
2. **スクリーンショットを撮影**（最優先）
3. **動作テストを実施**
4. **ZIPファイルを作成**
5. **Chrome Web Store Developer Dashboardで申請**

準備ができ次第、申請を進めてください！
