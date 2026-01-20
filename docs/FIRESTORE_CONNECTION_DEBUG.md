# Firestore接続問題のデバッグガイド

## 問題の症状

- 保存済みの求人が表示されない
- 拡張機能で新しく保存しても表示されない

## 確認すべきポイント

### 1. ブラウザのコンソールでエラーを確認

**Webアプリ側**:
1. ブラウザの開発者ツールを開く（F12）
2. Consoleタブを確認
3. 以下のログを確認:
   - `[JobList] Firebase初期化チェック`
   - `[JobList] Firestoreクエリを開始...`
   - `[JobList] データ取得成功` または `❌ [JobList] データ取得エラー`

**拡張機能側**:
1. 拡張機能のポップアップを開く
2. 右クリック → 「検証」を選択
3. Consoleタブでエラーを確認

### 2. Firestore Security Rulesの確認

**問題の可能性**: Security Rulesが厳しすぎて、データを読み取れない

**確認方法**:
1. Firebase Console → Firestore Database → ルールタブ
2. 現在のルールを確認

**推奨ルール**（匿名ユーザーも許可）:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      // 読み書き: 匿名ユーザーも許可（簡易版）
      allow read, write: if true;
    }
    
    match /rateLimits/{rateLimitId} {
      allow read, write: if true;
    }
  }
}
```

**注意**: 上記のルールは開発用です。本番環境では適切な認証を設定してください。

### 3. 環境変数の確認

**Netlify環境変数**:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `GEMINI_API_KEY`

**確認方法**:
1. Netlify Dashboard → Site settings → Environment variables
2. すべての環境変数が設定されているか確認

### 4. Firebase Consoleでデータを確認

**確認方法**:
1. Firebase Console → Firestore Database → データタブ
2. `jobs`コレクションにデータが存在するか確認
3. データの構造を確認（`userId`フィールドが存在するか）

### 5. ネットワークタブでAPIリクエストを確認

**確認方法**:
1. ブラウザの開発者ツール → Networkタブ
2. 拡張機能で保存を試みる
3. `/api/jobs/capture`へのリクエストを確認
4. レスポンスのステータスコードを確認（200 OKか、エラーか）

## よくある問題と解決策

### 問題1: `db is null`

**原因**: Firebase環境変数が設定されていない

**解決策**:
1. Netlify環境変数を確認
2. 環境変数が正しく設定されているか確認
3. Netlifyを再デプロイ

### 問題2: `Permission denied`

**原因**: Firestore Security Rulesが厳しすぎる

**解決策**:
1. Firebase ConsoleでSecurity Rulesを確認
2. 上記の推奨ルールに変更（開発用）
3. 「公開」ボタンをクリック

### 問題3: `Missing or insufficient permissions`

**原因**: 認証が必要だが、匿名ユーザーがアクセスできない

**解決策**:
1. Security Rulesで匿名ユーザーも許可する
2. または、Webアプリでログインする

### 問題4: データは保存されているが表示されない

**原因**: 
- `userId`フィールドが異なる
- `isArchived`フィルタが有効
- クエリのインデックスが不足

**解決策**:
1. Firebase Consoleでデータの`userId`を確認
2. Webアプリで「アーカイブ済みを表示」を確認
3. Firebase Consoleでインデックスを作成（必要に応じて）

## デバッグ手順

1. **ブラウザのコンソールでログを確認**
   - `[JobList]`で始まるログを確認
   - エラーメッセージを確認

2. **Firebase Consoleでデータを確認**
   - `jobs`コレクションにデータが存在するか
   - データの構造が正しいか

3. **Security Rulesを確認**
   - 匿名ユーザーが読み書きできるか
   - ルールが正しく公開されているか

4. **環境変数を確認**
   - Netlify環境変数が設定されているか
   - 環境変数の値が正しいか

5. **APIリクエストを確認**
   - Networkタブでリクエストの成功/失敗を確認
   - レスポンスの内容を確認

## 緊急時の対処法

**一時的にSecurity Rulesを緩和**（開発用のみ）:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**注意**: このルールは誰でも読み書きできるため、本番環境では使用しないでください。
