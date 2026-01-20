# Firestore Security Rules デバッグガイド

## 現在の状況

Security Rulesを変更したが、まだ `permission-denied` エラーが出ている。

## 確認すべきポイント

### 1. Security Rulesが正しく公開されているか

1. Firebase Console → Firestore Database → ルールタブ
2. ルールが保存されているか確認
3. **「公開」ボタンをクリックしたか確認**（重要！）
4. 公開後、数秒待ってからブラウザをリロード

### 2. 一時的にすべて許可するルールでテスト

まず、以下で動作確認してください（**開発用のみ**）:

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

このルールで動作する場合、問題はルールの条件です。
このルールでも動作しない場合、別の問題（Firebase設定など）の可能性があります。

### 3. データのuserIdフィールドを確認

Firebase Console → Firestore Database → データタブ → `jobs`コレクション

データの`userId`フィールドを確認：
- `userId`が存在するか
- `userId`の値が何か（`anonymous`か、ユーザーIDか）

### 4. 認証状態を確認

ブラウザのコンソールで以下を実行：

```javascript
// 認証状態を確認
import { auth } from '@/lib/firebase';
console.log('Current user:', auth?.currentUser?.uid);
```

または、Firebase Console → Authentication → Users で、ユーザーID `U4JlGR9pgtVDMnX6ITTqZgpU1L43` が存在するか確認。

## 推奨される修正手順

### Step 1: 一時的にすべて許可（動作確認用）

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

1. このルールを設定
2. 「公開」をクリック
3. ブラウザをリロード
4. エラーが消えるか確認

**動作する場合**: Step 2に進む
**動作しない場合**: Firebase設定やネットワークの問題の可能性

### Step 2: 認証済みユーザーのみ許可

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      // 認証済みユーザーはすべて読み書き可能（開発用）
      allow read, write: if request.auth != null;
    }
    
    match /rateLimits/{rateLimitId} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: userIdベースの制限（本番用）

データの`userId`フィールドを確認してから、以下を適用：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      // 読み取り: 認証済みユーザーは自分のデータまたはanonymousのデータを読み取り可能
      allow read: if request.auth != null && 
                     (resource == null || 
                      resource.data.userId == request.auth.uid || 
                      resource.data.userId == "anonymous" ||
                      !resource.data.keys().hasAny(['userId'])); // userIdフィールドがない場合も許可
      
      // 作成: 認証済みユーザーは自分のuserIdで作成可能
      allow create: if request.auth != null && 
                       (request.resource.data.userId == request.auth.uid || 
                        request.resource.data.userId == "anonymous");
      
      // 更新・削除: 認証済みユーザーは自分のデータのみ
      allow update, delete: if request.auth != null && 
                               resource.data.userId == request.auth.uid;
    }
    
    match /rateLimits/{rateLimitId} {
      allow read, write: if true;
    }
  }
}
```

## よくある問題

### 問題1: ルールを保存したが公開していない

**症状**: ルールを変更したが、エラーが続く

**解決策**: 「公開」ボタンを必ずクリック

### 問題2: データにuserIdフィールドがない

**症状**: 古いデータに`userId`フィールドがない

**解決策**: ルールで`userId`フィールドがない場合も許可する条件を追加

### 問題3: userIdの値が異なる

**症状**: データの`userId`が`anonymous`だが、認証済みユーザーでアクセスしている

**解決策**: ルールで`anonymous`のデータも認証済みユーザーが読み取れるようにする

## デバッグ用のルール（推奨）

まず、以下で動作確認してください：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jobs/{jobId} {
      // 認証済みユーザーはすべて読み書き可能
      allow read, write: if request.auth != null;
    }
    
    match /rateLimits/{rateLimitId} {
      allow read, write: if true;
    }
  }
}
```

このルールで動作する場合、問題は`userId`の条件です。
このルールでも動作しない場合、認証状態やFirebase設定に問題がある可能性があります。
