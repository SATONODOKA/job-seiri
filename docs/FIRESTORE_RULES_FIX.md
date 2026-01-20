# Firestore Security Rules 修正ガイド

## 現在のエラー

```
FirebaseError: Missing or insufficient permissions.
```

## 原因

Firestore Security Rulesが厳しすぎて、認証済みユーザーでもデータを読み取れない状態です。

## 解決策

### 1. Firebase ConsoleでSecurity Rulesを修正

1. **Firebase Consoleにアクセス**
   - https://console.firebase.google.com/
   - プロジェクト「job-seiri」を選択

2. **Firestore Database → ルールタブを開く**

3. **以下のルールに置き換える**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // jobsコレクション
    match /jobs/{jobId} {
      // 読み取り: 認証済みユーザーは自分のデータ、または匿名ユーザーのデータも読み取り可能
      allow read: if request.auth != null && 
                     (resource == null || 
                      resource.data.userId == request.auth.uid || 
                      resource.data.userId == "anonymous");
      
      // 作成: 認証済みユーザーは自分のuserIdで作成可能、またはanonymousで作成可能
      allow create: if request.auth != null && 
                       (request.resource.data.userId == request.auth.uid || 
                        request.resource.data.userId == "anonymous");
      
      // 更新: 認証済みユーザーは自分のデータを更新可能
      allow update: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
      
      // 削除: 認証済みユーザーは自分のデータを削除可能
      allow delete: if request.auth != null && 
                       resource.data.userId == request.auth.uid;
    }
    
    // rateLimitsコレクション（レート制限用）
    match /rateLimits/{rateLimitId} {
      allow read, write: if true;
    }
  }
}
```

4. **「公開」ボタンをクリック**

### 2. より簡単なルール（開発用・一時的）

もし上記のルールでも動作しない場合、一時的に以下のルールを使用してください（**開発用のみ**）:

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

**注意**: このルールは誰でも読み書きできるため、**本番環境では使用しないでください**。

## 確認方法

1. Security Rulesを更新後、ブラウザをリロード
2. ブラウザのコンソールでエラーが消えているか確認
3. 求人一覧が表示されるか確認

## 環境変数の警告について

コンソールに表示されている環境変数の警告は、**クライアント側で環境変数が読み込まれていない**ことを示しています。

しかし、Firebaseは正常に初期化されているので、**サーバー側では環境変数が読み込まれています**。

この警告は開発環境では問題ありませんが、本番環境（Netlify）では環境変数が正しく設定されている必要があります。

## 次のステップ

1. Security Rulesを上記のルールに変更
2. 「公開」ボタンをクリック
3. ブラウザをリロード
4. エラーが解消されたか確認
