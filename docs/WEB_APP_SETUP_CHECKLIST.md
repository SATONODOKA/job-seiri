# Webアプリ動作確認チェックリスト（拡張機能除く）

## 現在のエラーについて

**エラー**: `Cannot read properties of undefined (reading 'local')`

このエラーは拡張機能側（`chrome.storage.local`）の問題ですが、Webアプリ側の設定も確認が必要です。

---

## Webアプリ側で必要な設定・確認事項

### 1. Netlify環境変数の確認（必須）

**確認手順**:
1. Netlify Dashboard → サイト「job-seiri」→ Site settings → Environment variables
2. 以下の環境変数が設定されているか確認

**必須環境変数**:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=job-seiri.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=job-seiri
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=job-seiri.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=506993669324
NEXT_PUBLIC_FIREBASE_APP_ID=1:506993669324:web:693e485bcd9a546aefbe69
GEMINI_API_KEY=your_gemini_api_key
```

**オプション環境変数**（公開後に設定）:
```
EXTENSION_ID=your_chrome_extension_id
```

**確認方法**:
- Netlifyのデプロイログで環境変数が読み込まれているか確認
- ブラウザのコンソールでFirebase初期化のログを確認

---

### 2. Firestore Security Rules の設定（必須・既に設定済みとのこと）

**確認事項**:
- [ ] Security Rulesが設定されているか
- [ ] `jobs`コレクションへの読み書きが適切に制限されているか
- [ ] `rateLimits`コレクションへの書き込みが許可されているか

**確認方法**:
1. Firebase Console → Firestore Database → ルールタブ
2. 以下のルールが設定されているか確認

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      allow read, write: if request.auth == null || 
                            (request.auth != null && 
                             (resource == null || resource.data.userId == request.auth.uid));
    }
    
    match /rateLimits/{rateLimitId} {
      allow read, write: if true;
    }
  }
}
```

---

### 3. プライバシーポリシーページの内容確認

**現状**: `app/privacy-policy/page.tsx`が既に作成されています ✅

**確認事項**:
- [ ] 内容が実装と一致しているか
- [ ] HTML構造の記載を削除（実装では送信していないため）

**修正が必要な箇所**:
- 44行目: 「HTML構造（最大50,000文字）」の記載を削除または修正

---

### 4. サポートページの作成（推奨）

**現状**: サポートページが未作成の可能性があります

**作業**:
1. `app/support/page.tsx`を作成
2. よくある質問（FAQ）、問い合わせフォーム等を追加
3. URL: `https://kyujin-bookmark.netlify.app/support`

---

### 5. 動作確認

**確認項目**:
- [ ] Webアプリが正常に起動するか
- [ ] ログイン機能が正常に動作するか
- [ ] 求人一覧が正常に表示されるか
- [ ] フィルター機能が正常に動作するか
- [ ] 削除・アーカイブ機能が正常に動作するか
- [ ] プライバシーポリシーページが正常に表示されるか

---

## プライバシーポリシーページの修正

実装では`htmlStructure`を送信していないため、プライバシーポリシーの記載を修正する必要があります。

**修正箇所**: `app/privacy-policy/page.tsx` 44行目

**修正前**:
```tsx
<li>ページのテキストコンテンツ（最大20,000文字）</li>
<li>HTML構造（最大50,000文字、スクリプトやスタイルタグは除去）</li>
<li>メタタグ情報（name、property、itemprop属性）</li>
```

**修正後**:
```tsx
<li>ページのテキストコンテンツ（最大20,000文字）</li>
<li>メタタグ情報（最小化、または送信しない）</li>
```

---

## サポートページの作成（推奨）

**ファイル**: `app/support/page.tsx`（新規作成）

**内容例**:
- よくある質問（FAQ）
- トラブルシューティング
- 問い合わせ方法

---

## 動作確認の手順

### 1. ローカル環境での確認

```bash
# 環境変数を設定
cp .env.example .env.local
# .env.localに環境変数を設定

# 開発サーバーを起動
npm run dev
```

### 2. Netlifyでの確認

1. Netlify Dashboardで最新のデプロイを確認
2. サイトURLにアクセス
3. ブラウザのコンソールでエラーを確認
4. Firebase初期化のログを確認

---

## エラーの対処

### `Cannot read properties of undefined (reading 'local')`

このエラーは拡張機能側の問題ですが、Webアプリ側で確認すべき点：

1. **拡張機能が正しく読み込まれているか**
   - `chrome://extensions/`で拡張機能を確認
   - エラーが表示されていないか確認

2. **manifest.jsonの権限**
   - `storage`権限が含まれているか確認（既に含まれています ✅）

3. **拡張機能の再読み込み**
   - 拡張機能を無効化→有効化
   - または、拡張機能を再インストール

---

## まとめ

### Webアプリ側で必要な作業

1. **Netlify環境変数の確認**（必須）
   - Firebase環境変数が設定されているか
   - `GEMINI_API_KEY`が設定されているか

2. **Firestore Security Rulesの確認**（必須・既に設定済み）
   - ルールが正しく設定されているか確認

3. **プライバシーポリシーページの修正**（推奨）
   - HTML構造の記載を削除

4. **サポートページの作成**（推奨）
   - `app/support/page.tsx`を作成

5. **動作確認**（必須）
   - Webアプリが正常に動作するか確認

### 拡張機能側のエラーについて

`chrome.storage.local`のエラーは、拡張機能側の問題です。以下の確認を推奨：

1. 拡張機能を再読み込み
2. `manifest.json`の`storage`権限を確認（既に含まれています ✅）
3. ブラウザのコンソールで詳細なエラーを確認

---

## 次のステップ

1. Netlify環境変数を確認
2. プライバシーポリシーページを修正
3. サポートページを作成（オプション）
4. 動作確認を実施
