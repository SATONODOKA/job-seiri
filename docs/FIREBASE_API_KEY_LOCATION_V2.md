# Firebase APIキーの確認と更新方法（最新版）

## 📍 現在表示されている画面からAPIキーを確認

画像を見ると、Firebase Consoleの「プロジェクトの設定」画面に `firebaseConfig` が表示されています。

### 現在のAPIキー

`firebaseConfig` オブジェクトの中に以下のAPIキーが表示されています：

```javascript
apiKey: "AIzaSyDuMsPnu10uc0LiaHFJGiy4U4cojCpeWPY"
```

**このAPIキーが現在使用されているAPIキーです。**

## 🔄 APIキーの更新方法

Firebase ConsoleのUIが変更され、APIキーの管理がGoogle Cloud Consoleに移動している可能性があります。以下の方法でAPIキーを管理できます。

### 方法1: Google Cloud Consoleから直接アクセス（推奨）

1. 現在のFirebase Console画面で、右上の **「Google Cloud Consoleで開く」** リンクを探す
2. または、直接 [Google Cloud Console](https://console.cloud.google.com/) にアクセス
3. プロジェクト `job-seiri` を選択
4. 左側のメニューから **「APIとサービス」** → **「認証情報」** をクリック
5. **「APIキー」** セクションでAPIキーの一覧が表示されます

### 方法2: Firebase ConsoleからGoogle Cloud Consoleに移動

1. Firebase Consoleの「プロジェクトの設定」画面で
2. ページ上部または下部に **「Google Cloud Consoleで開く」** または **「このプロジェクトの設定を管理」** というリンクを探す
3. クリックするとGoogle Cloud Consoleに移動します

### 方法3: 直接URLでアクセス

以下のURLに直接アクセスしてください：

```
https://console.cloud.google.com/apis/credentials?project=job-seiri
```

このURLで、プロジェクト `job-seiri` のAPIキー一覧が表示されます。

## 🔑 Google Cloud ConsoleでのAPIキー管理

### APIキーの確認

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクト `job-seiri` を選択（上部のプロジェクト選択ドロップダウンから）
3. 左側のメニューから **「APIとサービス」** → **「認証情報」** をクリック
4. **「APIキー」** セクションで、現在のAPIキー一覧が表示されます

### 新しいAPIキーを作成

1. **「認証情報」** ページで、上部の **「認証情報を作成」** → **「APIキー」** をクリック
2. 新しいAPIキーが作成されます
3. **すぐにコピーしてください**（後から確認するのは難しい場合があります）

### 古いAPIキーを削除

1. APIキー一覧で、削除したいAPIキーを探す
2. 右側の **「削除」** または **「編集」** をクリック
3. **「削除」** を選択

## 📋 新しいAPIキーをNetlifyに設定

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. サイト `kyujin-bookmark` を選択
3. **サイト設定 → Environment variables** を開く
4. `NEXT_PUBLIC_FIREBASE_API_KEY` を探す
5. **「Edit」** をクリック
6. 新しいAPIキーを貼り付け
7. **「Save」** をクリック
8. **新しいデプロイを実行**（重要！）

## ⚠️ 注意事項

1. **現在のAPIキー**: `AIzaSyDuMsPnu10uc0LiaHFJGiy4U4cojCpeWPY` が表示されていますが、これが漏洩したAPIキー `AIzaSyDg3-q0Hn-GBitx3NscOp6hQ9Fw3LWfRzw` と異なる場合は、既に更新されている可能性があります。

2. **漏洩したAPIキーの確認**: Google Cloud Consoleで、漏洩したAPIキー `AIzaSyDg3-q0Hn-GBitx3NscOp6hQ9Fw3LWfRzw` がまだ存在するか確認してください。

3. **APIキーの制限**: 新しいAPIキーを作成する際は、**「アプリの制限」** を設定して、特定のWebアプリからのみ使用可能にすることを推奨します。

## 🔗 参考リンク

- [Google Cloud Console - 認証情報](https://console.cloud.google.com/apis/credentials?project=job-seiri)
- [Firebase Console](https://console.firebase.google.com/)
