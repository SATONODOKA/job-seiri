# Firebase APIキーの制限設定ガイド（修正版）

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

### 2. APIの制限（推奨）

**目的**: Firebase関連のAPIのみ使用可能にする

#### 設定手順

1. 同じAPIキーの編集画面で
2. **「APIの制限」** セクションで：
   - **「APIを制限する」** を選択
   - **「APIを選択」** をクリック
   - 検索ボックスで以下のAPIを検索して選択：
     - ✅ **Identity Toolkit API** ← Firebase Authenticationの実際のAPI名
     - ✅ **Cloud Firestore API**
     - ✅ **Firebase Installations API**
   - **「保存」** をクリック

#### 正しいAPI名

Firebase Authenticationは、Google Cloud Consoleでは **「Identity Toolkit API」** という名前になっています。

選択すべきAPI：
- **Identity Toolkit API** - Firebase Authentication（認証機能）に必要
- **Cloud Firestore API** - Firestore（データベース機能）に必要
- **Firebase Installations API** - Firebase SDKの初期化に必要

## 🔍 API名の確認方法

もしAPIが見つからない場合：

1. **「APIを選択」** をクリック
2. 検索ボックスに以下のキーワードで検索：
   - `Identity Toolkit` - Firebase Authentication用
   - `Firestore` - Firestore用
   - `Firebase Installations` - Firebase SDK用
3. 検索結果から該当するAPIを選択

## ⚠️ 注意事項

### 制限を設定する前の確認

1. **動作確認**: 制限を設定する前に、APIキーが正常に動作することを確認してください
2. **段階的な設定**: まずHTTPリファラーの制限を設定し、動作確認してからAPIの制限を追加することを推奨します
3. **ローカル開発環境**: ローカル開発環境（`localhost:3001`）も追加することを忘れないでください

### APIが見つからない場合

もし上記のAPIが見つからない場合：

1. **「APIとサービス」** → **「ライブラリ」** をクリック
2. 検索ボックスで `Identity Toolkit` を検索
3. **「有効にする」** をクリック（無効になっている場合）
4. 同様に `Cloud Firestore API` と `Firebase Installations API` も有効にする

## 📋 チェックリスト

### HTTPリファラー（ウェブサイト）の制限
- [ ] `https://kyujin-bookmark.netlify.app/*` を追加
- [ ] `https://kyujin-bookmark.netlify.app` を追加
- [ ] `http://localhost:3001/*` を追加（ローカル開発用）
- [ ] `http://localhost:3001` を追加（ローカル開発用）

### APIの制限
- [ ] Identity Toolkit API を選択（Firebase Authentication用）
- [ ] Cloud Firestore API を選択
- [ ] Firebase Installations API を選択

### 動作確認
- [ ] 本番環境（Netlify）でログインできることを確認
- [ ] ローカル開発環境でログインできることを確認
- [ ] Firestoreにデータを保存できることを確認

## 🔗 参考リンク

- [Google Cloud Console - 認証情報](https://console.cloud.google.com/apis/credentials?project=job-seiri)
- [Google Cloud Console - APIライブラリ](https://console.cloud.google.com/apis/library?project=job-seiri)
- [APIキーの制限の設定](https://cloud.google.com/docs/authentication/api-keys#restricting_api_keys)
