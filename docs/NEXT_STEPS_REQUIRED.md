# 今から必要な準備（残りの作業）

## ✅ 既に完了していること

- Chrome拡張機能の`config.js`設定済み（`API_URL = "https://job-seiri.netlify.app/api/jobs/capture"`）
- `.env.local`に環境変数設定済み（ローカル開発用）

---

## 🔴 今から必要な作業（必須）

### 1. Netlify環境変数の設定（約5分）

**これがないとアプリは動作しません。**

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. サイトを選択
3. **サイト設定 → Environment variables → 変数を追加**

以下の環境変数を**1つずつ**追加：

#### Firebase環境変数（必須・6個）
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDg3-q0Hn-GBitx3NscOp6hQ9Fw3LWfRzw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=job-seiri.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=job-seiri
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=job-seiri.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=506993669324
NEXT_PUBLIC_FIREBASE_APP_ID=1:506993669324:web:693e485bcd9a546aefbe69
```

#### Gemini API環境変数（LLM機能を使用する場合）
```
GEMINI_API_KEY=AIzaSyBAkiikASl6L4gGwmGdoNk7IPw21w3xZF8
```

**⚠️ 重要**: 
- 環境変数を追加した後、**必ず新しいデプロイを実行**
- Netlifyダッシュボード → Deploys → 「Trigger deploy」→ 「Deploy site」
- または、新しいコミットをプッシュ

---

### 2. デプロイの確認（約2分）

1. Netlifyダッシュボード → **Deploys** タブ
2. 最新のデプロイが**成功**しているか確認
3. 失敗している場合は、ログを確認してエラーを修正

---

### 3. Chrome拡張機能の読み込み（初回のみ・約2分）

1. Chromeで `chrome://extensions/` を開く
2. **右上の「デベロッパーモード」をON**
3. **「パッケージ化されていない拡張機能を読み込む」をクリック**
4. 以下のディレクトリを選択：
   ```
   /Users/satonodoka/Documents/job-seiri/chrome-extension
   ```
5. 拡張機能が読み込まれることを確認

**注意**: 一度読み込めば、`config.js`を変更した場合のみ再読み込みが必要

---

### 4. 動作確認（約3分）

#### 4-1. Webアプリの確認
1. `https://job-seiri.netlify.app` にアクセス
2. ログインページが表示されることを確認
3. アカウントを作成またはログイン
4. CSSが正しく適用されているか確認

#### 4-2. 拡張機能のテスト
1. 求人サイト（例: SmartHR、Sansan等）を開く
2. Chrome拡張機能のアイコンをクリック
3. 「この求人を保存」をクリック
4. 処理状況が表示されることを確認

#### 4-3. データの確認
1. Webアプリに戻る
2. 保存した求人が一覧に表示されることを確認

---

## 📋 チェックリスト

- [ ] Netlify環境変数（Firebase 6個）を設定
- [ ] Netlify環境変数（Gemini API）を設定（LLM機能を使用する場合）
- [ ] 新しいデプロイを実行
- [ ] デプロイが成功していることを確認
- [ ] Chrome拡張機能を読み込む（初回のみ）
- [ ] Webアプリが正常に表示されることを確認
- [ ] 拡張機能から求人を保存できることを確認

---

## ⚠️ よくある失敗パターン

1. **環境変数を設定したがデプロイしていない**
   → 環境変数を追加した後、必ず新しいデプロイを実行

2. **環境変数の変数名が間違っている**
   → `NEXT_PUBLIC_`プレフィックスを忘れない

3. **Chrome拡張機能を読み込んでいない**
   → `chrome://extensions/`で読み込む必要がある

4. **config.jsのAPI_URLが間違っている**
   → 既に設定済みですが、Netlifyでカスタムドメインを使用している場合は変更が必要

---

## 🆘 問題が発生した場合

1. **NetlifyのFunctionsログを確認**
   - Netlifyダッシュボード → Functions → Logs

2. **ブラウザのコンソールを確認**
   - F12 → Consoleタブ

3. **デプロイログを確認**
   - Netlifyダッシュボード → Deploys → 最新のデプロイ → Build log
