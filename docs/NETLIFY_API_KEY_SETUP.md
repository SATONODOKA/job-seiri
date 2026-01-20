# Netlify環境変数へのAPIキー設定ガイド

## ✅ 設定確認

APIキーの制限設定は完了しています：
- ✅ HTTPリファラー（ウェブサイト）の制限：4つのドメインが追加済み
- ✅ APIの制限：3つのAPIが選択済み（Cloud Firestore API、Firebase Installations API、Identity Toolkit API）

## 📋 次のステップ：Netlify環境変数に設定

### ステップ1: Netlifyダッシュボードにアクセス

1. [Netlifyダッシュボード](https://app.netlify.com/)にアクセス
2. ログイン（GitHubアカウントなど）

### ステップ2: サイトを選択

1. サイト一覧から **`kyujin-bookmark`** を選択
2. サイトダッシュボードが表示されます

### ステップ3: 環境変数設定を開く

1. 上部のメニューから **「Site settings」** または **「サイト設定」** をクリック
2. 左側のメニューから **「Environment variables」** または **「環境変数」** をクリック

### ステップ4: APIキーを設定

1. **「Add a variable」** または **「変数を追加」** をクリック
2. 以下の情報を入力：
   - **Key（キー）**: `NEXT_PUBLIC_FIREBASE_API_KEY`
   - **Value（値）**: `<Google Cloud Consoleで作成した新しいAPIキー>`（実際のAPIキーを貼り付け）
3. **「Save」** または **「保存」** をクリック

### ステップ5: 既存のAPIキーを更新する場合

もし既に `NEXT_PUBLIC_FIREBASE_API_KEY` が設定されている場合：

1. 環境変数一覧で `NEXT_PUBLIC_FIREBASE_API_KEY` を探す
2. 右側の **「Edit」** または **「編集」** をクリック
3. **Value（値）** を新しいAPIキーに更新
4. **「Save」** または **「保存」** をクリック

## ⚠️ 重要：デプロイの実行

**環境変数を追加・更新した後、必ず新しいデプロイを実行してください。**

### デプロイの実行方法

#### 方法1: Netlifyダッシュボードから

1. Netlifyダッシュボードの上部メニューから **「Deploys」** または **「デプロイ」** をクリック
2. 右上の **「Trigger deploy」** → **「Deploy site」** をクリック
3. デプロイが完了するまで待つ（通常1〜3分）

#### 方法2: Gitコミットから（推奨）

1. 何か小さな変更をコミット（例：READMEの更新）
2. `test` ブランチにプッシュ
3. Netlifyが自動的にデプロイを開始します

## 🧪 動作確認

デプロイが完了したら：

1. `https://kyujin-bookmark.netlify.app` にアクセス
2. ログインページが表示されることを確認
3. アカウントを作成またはログインを試す
4. エラーが出ないことを確認
5. Firestoreにデータを保存できることを確認

## 📋 チェックリスト

- [ ] Netlifyダッシュボードにアクセス
- [ ] サイト `kyujin-bookmark` を選択
- [ ] 環境変数設定を開く
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` を設定または更新
- [ ] 新しいデプロイを実行
- [ ] デプロイが完了するまで待つ
- [ ] Webアプリでログインできることを確認

## 🔗 参考リンク

- [Netlifyダッシュボード](https://app.netlify.com/)
- [Netlify環境変数の設定](https://docs.netlify.com/environment-variables/overview/)
