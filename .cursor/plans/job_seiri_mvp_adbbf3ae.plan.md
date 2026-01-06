---
name: Job Seiri MVP
overview: 求人ページをワンクリックで保存し、1ページの一覧で後からまとめて読み返せる「自分専用ジョブブックマーク」
todos:
  - id: task1-ui
    content: UI整理（メモ欄削除、タイトル入力削除、求人内容表示追加）
    status: completed
  - id: task2-mock
    content: モックJSONでFirestoreにデータ投入、表示確認
    status: completed
  - id: task3-extension
    content: Chrome拡張機能の基本実装
    status: completed
  - id: task4-extension-fix
    content: Chrome拡張機能を任意のURLで動作するよう修正
    status: pending
    dependencies:
      - task3-extension
---

# Job Seiri - 修正プラン

---

## 完了済み

- [x] タスク1: UI整理（メモ→content表示）
- [x] タスク2: モックデータでFirestore動作確認
- [x] タスク3: Chrome拡張機能の基本実装

---

## タスク4: Chrome拡張機能を任意のURLで動作させる

### 問題点

現状の拡張機能は以下の問題がある:

1. **content_scriptsが注入されていない場合がある**

- 拡張機能インストール前に開いていたタブでは動かない
- ページをリロードしないとcontent.jsが読み込まれない

2. **chrome.tabs.sendMessageが失敗する**

- content scriptが動いていないタブにメッセージを送るとエラー

### 解決策

**`chrome.scripting.executeScript`を使って、ボタンクリック時に動的にスクリプトを実行する**これなら:

- 拡張機能インストール前に開いていたページでも動く
- リロード不要
- 確実にスクリプトが実行される

---

### 4-1. manifest.json を更新

**ファイル:** `chrome-extension/manifest.json`**変更内容:** permissionsに`scripting`を追加、`host_permissions`を追加、`content_scripts`は削除

```json
{
  "manifest_version": 3,
  "name": "Job Seiri",
  "version": "1.0",
  "description": "求人ページをワンクリックで保存",
  "permissions": ["activeTab", "scripting"],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup.html"
  }
}
```

**削除するもの:**

- `content_scripts` ブロック全体（動的注入に切り替えるため不要）

---

### 4-2. content.js を削除

**ファイル:** `chrome-extension/content.js`**変更内容:** このファイルは削除する（popup.jsから直接スクリプトを実行するため）---

### 4-3. popup.js を全面書き換え

**ファイル:** `chrome-extension/popup.js`**変更内容:** chrome.scripting.executeScriptを使って動的にページ情報を取得

```javascript
// Firebase設定
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDFKthKGygKrqQ2n1MYoSpDJAouHwRp-eY",
  authDomain: "job-seiri.firebaseapp.com",
  projectId: "job-seiri",
  storageBucket: "job-seiri.firebasestorage.app",
  messagingSenderId: "506993669324",
  appId: "1:506993669324:web:693e485bcd9a546aefbe69"
};

// ページ情報を取得する関数（タブ内で実行される）
function getPageInfo() {
  // メインコンテンツを探す
  const main = document.querySelector('main') 
    || document.querySelector('article')
    || document.querySelector('[class*="job"]')
    || document.querySelector('[class*="content"]')
    || document.querySelector('[class*="description"]')
    || document.body;
  
  const content = main.innerText.trim().substring(0, 10000);
  
  return {
    url: window.location.href,
    title: document.title,
    content: content
  };
}

// Firestore REST APIで保存
async function saveToFirestore(data) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/jobs`;
  
  const body = {
    fields: {
      url: { stringValue: data.url },
      title: { stringValue: data.title },
      content: { stringValue: data.content },
      createdAt: { timestampValue: new Date().toISOString() }
    }
  };
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Firestore error:", errorText);
    throw new Error("保存に失敗しました");
  }
  return response.json();
}

// 保存ボタン
document.getElementById("saveBtn").addEventListener("click", async () => {
  const btn = document.getElementById("saveBtn");
  const status = document.getElementById("status");
  
  btn.disabled = true;
  btn.textContent = "保存中...";
  status.textContent = "";
  status.className = "";
  
  try {
    // 現在のタブを取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // chrome://やedge://などの特殊ページでは動作しない
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
      throw new Error("このページでは使用できません");
    }
    
    // ページ内でスクリプトを実行してページ情報を取得
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageInfo
    });
    
    if (!results || results.length === 0 || !results[0].result) {
      throw new Error("ページ情報を取得できませんでした");
    }
    
    const pageInfo = results[0].result;
    
    // Firestoreに保存
    await saveToFirestore(pageInfo);
    
    status.textContent = "保存しました!";
  } catch (error) {
    console.error(error);
    status.textContent = "エラー: " + error.message;
    status.className = "error";
  } finally {
    btn.disabled = false;
    btn.textContent = "この求人を保存";
  }
});
```

---

### 4-4. 拡張機能の再読み込み

修正後、Chromeで拡張機能を再読み込み:

1. `chrome://extensions/` を開く
2. Job Seiri の「更新」ボタン（リロードアイコン）をクリック
3. **ページのリロードは不要！** そのまま拡張機能ボタンをクリックして動作確認

---

### 4-5. テスト対象URL

以下のサイトでテストして動作確認:| サイト | URL例 ||--------|-------|| SmartHR | https://open.talentio.com/r/1/c/smarthr/pages/117648 || HERP Career | https://herp.careers/ 配下 || Wantedly | https://www.wantedly.com/projects/xxxxx || Green | https://www.green-japan.com/job/xxxxx || Indeed | https://jp.indeed.com/viewjob?jk=xxxxx |---

## Composerへの指示まとめ

### タスク4でやること

| ファイル | 変更内容 ||----------|----------|| `chrome-extension/manifest.json` | `content_scripts`削除、`host_permissions`追加 || `chrome-extension/content.js` | **削除** || `chrome-extension/popup.js` | 全面書き換え（`chrome.scripting.executeScript`を使用） |

### 変更後の動作

1. 任意のWebページを開く
2. 拡張機能ボタンをクリック
3. 「この求人を保存」をクリック
4. `chrome.scripting.executeScript`でページ情報を動的に取得
5. Firestoreに保存
6. Webアプリの一覧に表示される

---

## 次のPhase（後回し）

### Phase 5: AIマッチング

- 職務経歴書アップロード
- 「マッチ度計算」ボタン