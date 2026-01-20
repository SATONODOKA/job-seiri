# Firebase APIキーの制限設定ガイド

## 🔐 APIキーの制限の重要性

APIキーに制限を設定することで、不正使用を防ぎ、セキュリティを向上させます。

## 📋 設定すべき制限

### 1. HTTPリファラー（ウェブサイト）の制限（最重要）

**目的**: 特定のドメインからのみAPIキーを使用可能にする

#### 設定手順

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクト `job-seiri` を選択
3. **「APIとサービス」** → **「認証情報」** をクリック
4. 作成したAPIキーをクリック（または「編集」をクリック）
5. **「アプリケーションの制限」** セクションで：
   - **「HTTPリファラー（ウェブサイト）」** を選択
   - **「ウェブサイトの制限」** で **「項目を追加」** をクリック
   - 以下のドメインを追加：
     ```
     https://kyujin-bookmark.netlify.app/*
     https://kyujin-bookmark.netlify.app
     http://localhost:3001/*
     http://localhost:3001
     ```
   - **「保存」** をクリック

#### 追加するドメイン

- `https://kyujin-bookmark.netlify.app/*` - 本番環境（すべてのパス）
- `https://kyujin-bookmark.netlify.app` - 本番環境（ルート）
- `http://localhost:3001/*` - ローカル開発環境（すべてのパス）
- `http://localhost:3001` - ローカル開発環境（ルート）

**注意**: `*` はワイルドカードで、そのドメインのすべてのパスを許可します。

### 2. APIの制限（推奨）

**目的**: Firebase関連のAPIのみ使用可能にする

#### 設定手順

1. 同じAPIキーの編集画面で
2. **「APIの制限」** セクションで：
   - **「APIを制限する」** を選択
   - **「APIを選択」** をクリック
   - 以下のAPIを選択：
     - ✅ **Firebase Authentication API**
     - ✅ **Cloud Firestore API**
     - ✅ **Firebase Installations API**
     - ✅ **Firebase Remote Config API**（使用している場合）
   - **「保存」** をクリック

#### 選択すべきAPI

- **Firebase Authentication API** - 認証機能に必要
- **Cloud Firestore API** - データベース機能に必要
- **Firebase Installations API** - Firebase SDKの初期化に必要

## ⚠️ 注意事項

### 制限を設定する前の確認

1. **動作確認**: 制限を設定する前に、APIキーが正常に動作することを確認してください
2. **段階的な設定**: まずHTTPリファラーの制限を設定し、動作確認してからAPIの制限を追加することを推奨します
3. **ローカル開発環境**: ローカル開発環境（`localhost:3001`）も追加することを忘れないでください

### よくある問題

#### 問題1: 制限を設定したら動作しなくなった

**原因**: 許可されていないドメインからアクセスしている、または必要なAPIが選択されていない

**対処**:
1. HTTPリファラーの制限に正しいドメインが追加されているか確認
2. APIの制限に必要なAPIがすべて選択されているか確認
3. 一時的に制限を緩和して動作確認

#### 問題2: ローカル開発環境で動作しない

**原因**: `localhost` がHTTPリファラーの制限に追加されていない

**対処**:
- `http://localhost:3001/*` と `http://localhost:3001` を追加

## 📋 チェックリスト

### HTTPリファラー（ウェブサイト）の制限
- [ ] `https://kyujin-bookmark.netlify.app/*` を追加
- [ ] `https://kyujin-bookmark.netlify.app` を追加
- [ ] `http://localhost:3001/*` を追加（ローカル開発用）
- [ ] `http://localhost:3001` を追加（ローカル開発用）

### APIの制限
- [ ] Firebase Authentication API を選択
- [ ] Cloud Firestore API を選択
- [ ] Firebase Installations API を選択

### 動作確認
- [ ] 本番環境（Netlify）でログインできることを確認
- [ ] ローカル開発環境でログインできることを確認
- [ ] Firestoreにデータを保存できることを確認

## 🔗 参考リンク

- [Google Cloud Console - 認証情報](https://console.cloud.google.com/apis/credentials?project=job-seiri)
- [APIキーの制限の設定](https://cloud.google.com/docs/authentication/api-keys#restricting_api_keys)
