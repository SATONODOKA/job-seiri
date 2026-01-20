# Firebase Authentication統合ガイド

## 問題

現在、APIルートでFirebase AuthenticationのユーザーIDを正しく取得できていないため、Firestoreに保存される`userId`が`anonymous`になっています。

## 解決策

### 1. Firebase Admin SDKの設定

**必要な環境変数**:
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Firebase Admin SDK用のサービスアカウントキー（JSON形式）

**取得方法**:
1. Firebase Console → プロジェクト設定 → サービスアカウント
2. 「新しい秘密鍵の生成」をクリック
3. JSONファイルをダウンロード
4. JSONの内容をNetlify環境変数`FIREBASE_SERVICE_ACCOUNT_KEY`に設定（文字列として）

### 2. 拡張機能側の修正

拡張機能からFirebase AuthenticationのIDトークンを取得して送信する必要があります。

**現状**: 拡張機能は認証トークンを送信していない

**修正が必要**: `popup.js`でFirebase AuthenticationのIDトークンを取得して送信

### 3. Webアプリ側の修正

WebアプリからAPIを呼び出す場合、Firebase AuthenticationのIDトークンを送信する必要があります。

## 実装手順

### Step 1: Firebase Admin SDKのインストール

```bash
npm install firebase-admin
```

### Step 2: サービスアカウントキーの設定

1. Firebase Console → プロジェクト設定 → サービスアカウント
2. 「新しい秘密鍵の生成」をクリック
3. JSONファイルをダウンロード
4. Netlify環境変数に設定:
   - キー: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - 値: JSONファイルの内容（文字列として）

### Step 3: 拡張機能側の修正

`popup.js`でFirebase AuthenticationのIDトークンを取得して送信する必要があります。

**注意**: 拡張機能側でFirebase Authenticationを使う場合は、`manifest.json`に`identity`権限が必要です。

### Step 4: Webアプリ側の修正

WebアプリからAPIを呼び出す場合、Firebase AuthenticationのIDトークンを取得して送信します。

## 代替案: Webアプリ側で直接Firestoreに保存

拡張機能からAPIルート経由ではなく、Webアプリ側で直接Firestoreに保存する方法もあります。

この場合：
1. 拡張機能はWebアプリのURLを開く
2. Webアプリ側でFirebase AuthenticationのユーザーIDを使ってFirestoreに保存

## 現在の実装状況

- ✅ Firebase Admin SDKの初期化コードを作成済み
- ✅ APIルートでIDトークン検証を実装済み
- ⚠️ 拡張機能側でIDトークンを送信する実装が必要
- ⚠️ サービスアカウントキーの設定が必要
