# 公開前の作業チェックリスト

## ⚠️ 必須作業（公開前に必ず実施）

### 1. Firestore Security Rules の設定（最重要）

**現状**: Security Rulesが設定されていない可能性があります。設定しないと、誰でもデータを読み書きできてしまいます。

#### 作業手順

1. **Firebase Consoleにアクセス**
   - https://console.firebase.google.com/
   - プロジェクト「job-seiri」を選択

2. **Firestore Database → ルールタブを開く**

3. **以下のSecurity Rulesを設定**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // jobsコレクション
    match /jobs/{jobId} {
      // 読み取り: 自分のデータのみ（認証済みユーザーの場合）
      // 匿名ユーザーの場合は、IPベースの識別子で判定（簡易版）
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid
                  || request.auth == null; // 匿名ユーザーも許可（簡易版）
      
      // 作成: 認証済みユーザーのみ、自分のuserIdを設定
      // 匿名ユーザーの場合は、IPベースの識別子を使用
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid
                    || request.auth == null; // 匿名ユーザーも許可（簡易版）
      
      // 更新: 自分のデータのみ
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid
                    || request.auth == null; // 匿名ユーザーも許可（簡易版）
      
      // 削除: 自分のデータのみ
      allow delete: if request.auth != null && 
                       resource.data.userId == request.auth.uid
                    || request.auth == null; // 匿名ユーザーも許可（簡易版）
    }
    
    // rateLimitsコレクション（レート制限用）
    match /rateLimits/{rateLimitId} {
      // 読み書き: すべて許可（レート制限のため）
      allow read, write: if true;
    }
  }
}
```

4. **「公開」ボタンをクリック**

**注意**: 上記のルールは簡易版です。本番環境では、より厳格な認証を推奨します。

#### より厳格なルール（推奨）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証済みユーザーのみアクセス可能
    match /jobs/{jobId} {
      allow read, write: if request.auth != null && 
                            (resource == null || resource.data.userId == request.auth.uid);
    }
    
    // rateLimitsは読み書き可能（レート制限のため）
    match /rateLimits/{rateLimitId} {
      allow read, write: if true;
    }
  }
}
```

**確認方法**: Firebase Consoleで「シミュレーター」を使用してルールをテスト

---

### 2. Netlify環境変数の設定

**現状**: 一部の環境変数が設定されていない可能性があります。

#### 作業手順

1. **Netlify Dashboardにアクセス**
   - https://app.netlify.com/
   - サイト「job-seiri」を選択

2. **Site settings → Environment variables を開く**

3. **以下の環境変数を確認・設定**

**必須環境変数（既に設定済みか確認）:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=job-seiri.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=job-seiri
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=job-seiri.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=506993669324
NEXT_PUBLIC_FIREBASE_APP_ID=1:506993669324:web:693e485bcd9a546aefbe69
GEMINI_API_KEY=your_gemini_api_key
```

**新規追加が必要な環境変数:**
```
EXTENSION_ID=your_chrome_extension_id
```
- **注意**: 拡張機能をChrome Web Storeに公開した後に、拡張機能IDを取得して設定してください
- 公開前は設定不要（開発環境では`*`が許可されます）

**確認方法**: Netlifyのデプロイログで環境変数が読み込まれているか確認

---

### 3. アイコン画像の準備

**必須**: Chrome Web Storeに公開するには、アイコン画像が必要です。

#### 作業手順

1. **アイコン画像を作成**
   - **サイズ**: 128x128 pixels（必須）
   - **形式**: PNG（推奨）
   - **背景**: 透明または単色
   - **ファイル名**: `icon-128.png`

2. **chrome-extensionフォルダに配置**
   ```
   chrome-extension/
   ├── icon-128.png  ← ここに配置
   ├── manifest.json
   └── ...
   ```

3. **manifest.jsonに追加（オプション）**
   ```json
   {
     "manifest_version": 3,
     "name": "Job Seiri",
     "version": "1.0",
     "description": "求人ページをワンクリックで保存",
     "icons": {
       "128": "icon-128.png"
     },
     ...
   }
   ```

**ツール**: 
- オンラインアイコンジェネレータ: https://www.favicon-generator.org/
- デザインツール: Figma、Canva等

---

### 4. スクリーンショットの準備

**必須**: Chrome Web Storeに公開するには、最低1枚のスクリーンショットが必要です。

#### 作業手順

1. **スクリーンショットを撮影**
   - **推奨サイズ**: 1280x800 pixels または 640x400 pixels
   - **形式**: PNGまたはJPEG
   - **枚数**: 最低1枚、推奨3枚以上

2. **推奨スクリーンショット順序**
   - **1枚目**: 拡張機能のポップアップ画面（保存ボタン表示）
   - **2枚目**: Webダッシュボードの一覧画面
   - **3枚目**: 求人詳細画面（抽出された情報表示）

3. **ファイル名を整理**
   ```
   screenshots/
   ├── screenshot-1-popup.png
   ├── screenshot-2-dashboard.png
   └── screenshot-3-detail.png
   ```

**撮影方法**:
- Chrome拡張機能のポップアップ: 拡張機能を開いてスクリーンショット
- Webダッシュボード: ブラウザで開いてスクリーンショット

---

### 5. ZIPファイルの作成

**必須**: Chrome Web Storeにアップロードするには、ZIPファイルが必要です。

#### 作業手順

1. **chrome-extensionフォルダに移動**
   ```bash
   cd chrome-extension
   ```

2. **除外ファイルを確認**
   - `.git/` ディレクトリ（含めない）
   - `node_modules/` ディレクトリ（含めない）
   - `.DS_Store` ファイル（含めない）
   - `config.js`（機密情報を含む可能性があるため含めない）
   - `*.log` ファイル（含めない）

3. **ZIPファイルを作成**
   ```bash
   # macOS/Linux
   zip -r ../job-seiri-v1.0.0.zip . \
     -x "*.git*" \
     -x "*node_modules*" \
     -x "*.DS_Store" \
     -x "config.js" \
     -x "*.log"
   ```

   **Windowsの場合**:
   - エクスプローラーで`chrome-extension`フォルダを選択
   - 右クリック → 「送る」→ 「圧縮（zip形式）フォルダー」
   - 手動で`.git`、`node_modules`、`config.js`を除外

4. **ZIPファイルの内容を確認**
   - ZIPファイルを展開して、不要なファイルが含まれていないか確認
   - `manifest.json`、`popup.html`、`popup.js`が含まれているか確認

**ファイルサイズ**: 10MB以下（通常は1MB以下）

---

### 6. 動作テストの実施

**必須**: 公開前に動作確認を実施してください。

#### テスト項目

1. **拡張機能の基本動作**
   - [ ] 拡張機能が正常に読み込まれるか
   - [ ] ポップアップが正常に表示されるか
   - [ ] 保存ボタンが正常に動作するか

2. **各種求人サイトでの動作確認**
   - [ ] リクルート（https://www.r-agent.com/）
   - [ ] マイナビ（https://job.mynavi.jp/）
   - [ ] doda（https://doda.jp/）
   - [ ] Green（https://www.green-japan.com/）
   - [ ] Wantedly（https://www.wantedly.com/）

3. **エラーケースの確認**
   - [ ] `chrome://`ページで適切なエラーが表示されるか
   - [ ] PDFページで適切なエラーが表示されるか
   - [ ] ネットワークエラー時に適切なメッセージが表示されるか

4. **Webアプリの動作確認**
   - [ ] 保存した求人が正常に表示されるか
   - [ ] フィルター機能が正常に動作するか
   - [ ] 削除機能が正常に動作するか
   - [ ] アーカイブ機能が正常に動作するか

5. **レート制限の確認**
   - [ ] 一気に10件保存できるか
   - [ ] 一気に15件保存できるか
   - [ ] レート制限に達した場合、適切なエラーが表示されるか

---

### 7. プライバシーポリシーURLの確認

**必須**: データを収集する拡張機能の場合、プライバシーポリシーURLは必須です。

#### 作業手順

1. **プライバシーポリシーページを作成**
   - ファイル: `docs/PRIVACY_POLICY.md`（既に作成済み ✅）
   - 内容を確認して、必要に応じて修正

2. **Netlifyで公開**
   - プライバシーポリシーをWebアプリに追加
   - URL: `https://kyujin-bookmark.netlify.app/privacy-policy`
   - または、別のURLに公開

3. **アクセス確認**
   - [ ] URLがアクセス可能か確認
   - [ ] 内容が正しく表示されるか確認

**注意**: プライバシーポリシーに問い合わせ先メールアドレスを設定してください。

---

### 8. サポートURLの準備

**推奨**: サポートページがあると審査で有利です。

#### 作業手順

1. **サポートページを作成**
   - よくある質問（FAQ）
   - 問い合わせフォーム
   - トラブルシューティング

2. **Netlifyで公開**
   - URL: `https://kyujin-bookmark.netlify.app/support`

3. **アクセス確認**
   - [ ] URLがアクセス可能か確認

---

## 📋 作業チェックリスト

### 公開前の必須作業

- [ ] **Firestore Security Rulesを設定**
- [ ] **Netlify環境変数を確認・設定**
- [ ] **アイコン画像（128x128）を作成・配置**
- [ ] **スクリーンショット（最低1枚）を撮影**
- [ ] **ZIPファイルを作成（不要ファイルを除外）**
- [ ] **動作テストを実施（複数の求人サイトで確認）**
- [ ] **プライバシーポリシーURLがアクセス可能か確認**
- [ ] **サポートURLを準備（推奨）**

### 公開後の作業

- [ ] **Chrome Web Store Developer Dashboardで拡張機能IDを取得**
- [ ] **Netlify環境変数に`EXTENSION_ID`を設定**
- [ ] **公開後の動作確認を実施**
- [ ] **エラーログを監視**

---

## 🔧 技術的な確認事項

### Firestore Security Rules のテスト方法

1. **Firebase Console → Firestore Database → ルールタブ**
2. **「シミュレーター」タブを開く**
3. **以下のテストケースを実行**

**テストケース1: 認証済みユーザーが自分のデータを読み取る**
- 場所: `jobs/jobId`
- 読み取り: 許可されるべき ✅

**テストケース2: 認証済みユーザーが他人のデータを読み取る**
- 場所: `jobs/jobId`（userIdが異なる）
- 読み取り: 拒否されるべき ✅

**テストケース3: 匿名ユーザーがデータを作成**
- 場所: `jobs/jobId`
- 作成: 許可されるべき（簡易版ルールの場合）✅

---

## 📝 その他の確認事項

### manifest.jsonの確認

- [ ] バージョン番号が正しいか（1.0）
- [ ] 説明文が適切か
- [ ] 権限が最小限か（activeTab, scripting, storage）

### コードの確認

- [ ] 機密情報（APIキー等）がコードに含まれていないか
- [ ] `config.js`がZIPファイルに含まれていないか
- [ ] デバッグ用のconsole.logが適切にマスキングされているか

### ドキュメントの確認

- [ ] プライバシーポリシーが最新か
- [ ] ストア掲載文が準備できているか
- [ ] サポートページが準備できているか

---

## 🚀 公開手順（簡易版）

1. **上記のチェックリストをすべて完了**
2. **ZIPファイルを作成**
3. **Chrome Web Store Developer Dashboardにアクセス**
   - https://chrome.google.com/webstore/devconsole
4. **「新しいアイテム」をクリック**
5. **ZIPファイルをアップロード**
6. **説明文、権限説明文、Data Safetyを入力**
7. **スクリーンショットをアップロード**
8. **プライバシーポリシーURLを入力**
9. **「公開の変更を送信」をクリック**
10. **審査結果を待つ（通常1〜3営業日）**

---

## ⚠️ 注意事項

### 公開前に絶対に確認すべきこと

1. **Firestore Security Rulesが設定されているか**
   - 設定しないと、誰でもデータを読み書きできます

2. **機密情報がZIPファイルに含まれていないか**
   - `config.js`は含めないでください

3. **動作テストが完了しているか**
   - 複数の求人サイトで動作確認してください

4. **プライバシーポリシーURLがアクセス可能か**
   - 審査で必須です

### 公開後の注意事項

1. **拡張機能IDを取得したら、Netlify環境変数に設定**
2. **エラーログを監視**
3. **ユーザーフィードバックを収集**

---

## 📞 サポート

問題が発生した場合:
1. エラーログを確認
2. Firebase Consoleでデータを確認
3. Netlifyのデプロイログを確認
