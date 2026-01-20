---
name: Chrome Web Store審査対応修正
overview: ""
todos: []
---

# Chrome Web Store審査対応修正計画

## ⚠️ 重要: Gitブランチ管理

**この計画のすべての実装は `test` ブランチで行い、`main` ブランチは絶対に変更しません。**

### ブランチ運用ルール
1. **初回セットアップ**: `test` ブランチを作成し、すべての変更をこのブランチにコミット・プッシュ
2. **毎回の作業**: すべての変更は `test` ブランチに対して行う
3. **mainブランチ保護**: `main` ブランチへの直接コミット・マージは禁止
4. **確認方法**: コミット前に `git branch` で現在のブランチを確認

### 初回セットアップコマンド
```bash
git checkout -b test
git push -u origin test
```

## 目標
Chrome Web Store審査通過のため、以下の4つの最重要課題を解決：
1. host_permissionsの最小化（`<all_urls>`削除）
2. 送信データの最小化（`htmlStructure`送信停止）
3. API認証・レート制限の実装（サーバレス対応）
4. 求人ページ判定のサーバー側実装

## 修正内容

### P0: 必須修正（審査前に必須）

#### 1. manifest.json: host_permissions削除
**ファイル**: [chrome-extension/manifest.json](chrome-extension/manifest.json)

**変更内容**:
- `host_permissions`を完全削除
- `activeTab`と`scripting`のみで動作するように変更

```json
{
  "manifest_version": 3,
  "name": "Job Seiri",
  "version": "1.0",
  "description": "求人ページをワンクリックで保存",
  "permissions": ["activeTab", "scripting"],
  "action": {
    "default_popup": "popup.html"
  }
}
```

**根拠**: `activeTab`権限があれば、ユーザーがクリックしたタブの情報は取得可能。`<all_urls>`は審査で厳しく見られる。

#### 2. popup.js: htmlStructure送信停止、データ最小化、注入不可ページの例外処理
**ファイル**: [chrome-extension/popup.js](chrome-extension/popup.js)

**変更箇所**:
- `getPageInfo()`関数（82-193行）: `htmlStructure`の生成と返却を削除
- `saveToFirestore()`関数（196-278行）: `htmlStructure`を送信しないように修正
- `metaTags`を最小化（`og:title`, `og:description`のみ、または送らない）
- **注入不可ページの例外処理を追加**

**2-1. htmlStructure送信停止**

```javascript
// getPageInfo()の返り値からhtmlStructureを削除
return {
  url: window.location.href,
  title: document.title,
  content: textContent.substring(0, 20000),
  // htmlStructure: htmlContent.substring(0, 50000), // 削除
  metaTags: filteredMetaTags // 最小化（後述）
};
```

**2-2. metaTags最小化**

**方針**: MVPでは「まず送らない」でも成立。送る場合は「なぜ必要か」を1行で説明できる状態にする。

**審査用説明文**: 「タイトル補完と重複排除にのみ使用。og:titleとog:descriptionのみを送信し、個人情報を含む可能性のある他のメタタグは送信しません。」

**実装案**:
```javascript
// オプション1: 送らない（推奨・MVP）
metaTags: []

// オプション2: 最小化（og:title, og:descriptionのみ）
const metaTags = Array.from(document.querySelectorAll('meta'))
  .map(meta => ({
    name: meta.getAttribute('property') || meta.getAttribute('name'),
    content: meta.getAttribute('content')
  }))
  .filter(m => m.name && m.content && 
    (m.name === 'og:title' || m.name === 'og:description'));
```

**2-3. 注入不可ページの例外処理**

**対象ページ**:
- `chrome://`, `chrome-extension://`, `edge://`, `about:` など特殊ページ
- PDFビューア（ブラウザ内PDF）
- iframe内が主コンテンツのページ
- ログイン後のマイページ等、個人データが混ざりやすいページ

**実装案**:
```javascript
// 保存ボタンクリック時にチェック
document.getElementById("saveBtn").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 注入不可ページのチェック
    if (tab.url.startsWith("chrome://") || 
        tab.url.startsWith("chrome-extension://") || 
        tab.url.startsWith("edge://") || 
        tab.url.startsWith("about:")) {
      throw new Error("このページでは使用できません。\n\n理由: ブラウザの内部ページのため、情報を取得できません。");
    }
    
    // PDFページのチェック
    if (tab.url.endsWith('.pdf') || tab.url.includes('.pdf?')) {
      throw new Error("PDFファイルは直接保存できません。\n\n対処: PDFのURLをWebアプリから手動で保存してください。");
    }
    
    // スクリプト実行を試行
    let results;
    try {
      results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getPageInfo
      });
    } catch (scriptError) {
      // 注入失敗時の詳細なエラーメッセージ
      if (scriptError.message.includes('Cannot access')) {
        throw new Error("このページでは情報を取得できません。\n\n理由: ページのセキュリティ設定により、拡張機能がアクセスできません。\n\n対処: 通常のWebページ（http:// または https:// で始まるページ）でお試しください。");
      }
      throw scriptError;
    }
    
    // ... 既存の処理 ...
  } catch (error) {
    // エラーメッセージを表示
    status.textContent = "エラー: " + error.message;
    status.className = "error";
  }
});
```

**根拠**: HTML構造は個人情報が混入する可能性があり、審査で説明が困難。本文のみでLLM抽出は可能。注入不可ページの例外処理により、ユーザー体験と審査説明の両方を改善。

#### 3. API認証・レート制限の実装（サーバレス対応）
**ファイル**: [app/api/jobs/capture/route.ts](app/api/jobs/capture/route.ts)

**変更内容**:

**3-1. 認証チェック追加**
- リクエストヘッダーから認証トークンを取得
- 簡易トークン検証（本番ではFirebase Admin SDK推奨）
- 認証失敗時は401を返す（匿名ユーザーも許可する場合はオプション）

**3-2. レート制限追加（サーバレス対応）**

⚠️ **重要**: Netlify/サーバレス環境ではメモリベースのレート制限は効きません。以下のいずれかを実装する必要があります。

**実装方式の選択（実装工数順）**:

**方式A: Upstash Redis（推奨・実装工数: 中）**
- 無料枠あり、サーバレス対応
- `@upstash/ratelimit` パッケージを使用
- 実装例:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

const { success, limit, remaining } = await ratelimit.limit(clientId);
if (!success) {
  return NextResponse.json(
    { error: "レート制限に達しました" },
    { status: 429 }
  );
}
```

**方式B: Firestoreカウンタ（実装工数: 小）**
- 既存のFirestoreを使用
- 負荷とコストに注意（読み書きが増える）
- 実装例:
```typescript
// lib/rateLimitFirestore.ts
const rateLimitDoc = doc(db, "rateLimits", clientId);
const snapshot = await getDoc(rateLimitDoc);
const now = Date.now();
const windowMs = 60000; // 1分

if (!snapshot.exists()) {
  await setDoc(rateLimitDoc, { count: 1, resetAt: now + windowMs });
} else {
  const data = snapshot.data();
  if (now > data.resetAt) {
    await updateDoc(rateLimitDoc, { count: 1, resetAt: now + windowMs });
  } else if (data.count >= 10) {
    return NextResponse.json({ error: "レート制限" }, { status: 429 });
  } else {
    await updateDoc(rateLimitDoc, { count: data.count + 1 });
  }
}
```

**方式C: Cloudflare WAF/Rate Limiting（実装工数: 大）**
- Netlifyの前にCloudflareを配置
- 設定が複雑だが、最も堅牢

**推奨**: 方式A（Upstash Redis）を採用。無料枠で十分で、実装も簡単。

**3-3. userId付与**
- 認証済みユーザーの`userId`をFirestore保存時に付与
- 匿名ユーザーの場合は`anonymous`またはIPベースの識別子

**実装案**:
```typescript
// 認証チェック（簡易版: トークンベース、オプション）
const authHeader = request.headers.get("Authorization");
const token = authHeader?.replace("Bearer ", "") || null;
const userId = verifyToken(token) || "anonymous";

// レート制限チェック（Upstash Redis使用）
const clientId = userId !== "anonymous" ? userId : 
  request.headers.get("x-forwarded-for") || "unknown";
const { success } = await ratelimit.limit(clientId);
if (!success) {
  return NextResponse.json(
    { error: "レート制限に達しました。しばらく待ってから再試行してください。" },
    { status: 429 }
  );
}

// Gemini API呼び出しのレート制限（5件/分）
const geminiRateLimit = await ratelimit.limit(`gemini:${clientId}`, 5, 60000);
if (!geminiRateLimit.success) {
  return NextResponse.json(
    { error: "AI解析のレート制限に達しました。" },
    { status: 429 }
  );
}

// Firestore保存時にuserIdを付与
await addDoc(collection(db, "jobs"), {
  userId, // 追加
  // ... 既存フィールド
});
```

**根拠**: 認証なしではDB荒らしのリスク。レート制限はGemini APIコスト保護に必須。サーバレス環境では共有ストレージが必要。

#### 4. 求人ページ判定のサーバー側実装（仕様確定）
**ファイル**: [app/api/jobs/capture/route.ts](app/api/jobs/capture/route.ts), [lib/jobPageDetector.ts](lib/jobPageDetector.ts)（新規）

**変更内容**:
- 受信した`url`, `title`, `content`から求人ページ判定スコアを計算
- `pageType`フィールドを`job_detail` / `job_list` / `non_job`に分類
- **pageTypeごとの挙動を仕様化**（保存する/しない、ラベル、UI）

**pageTypeごとの挙動仕様**:

| pageType | 保存 | ラベル | UI表示 | 理由 |
|----------|------|--------|--------|------|
| `job_detail` | ✅ 通常保存 | なし | 通常表示 | 求人詳細ページと判定 |
| `job_list` | ✅ 保存する | 「一覧の可能性」 | 注意ラベル表示、本文は短く | 一覧ページの可能性（リンク多すぎ等） |
| `non_job` | ❌ デフォルト保存しない | - | エラーメッセージ＋「強制保存」オプション | 求人ではないページ（個人情報混入リスク） |

**実装案**:
```typescript
// lib/jobPageDetector.ts（新規作成）
export function calculateJobPageScore(
  url: string, 
  title: string, 
  content: string
): { 
  score: number; 
  pageType: 'job_detail' | 'job_list' | 'non_job'; 
  reasons: string[] 
} {
  let score = 0;
  const reasons: string[] = [];
  
  // URL判定（0-30点）
  if (/\/job\//i.test(url)) {
    score += 30;
    reasons.push('URLに"/job/"が含まれる');
  } else if (/\/career\//i.test(url)) {
    score += 25;
    reasons.push('URLに"/career/"が含まれる');
  } else if (/\/recruit\//i.test(url)) {
    score += 25;
    reasons.push('URLに"/recruit/"が含まれる');
  } else if (/\/detail\//i.test(url)) {
    score += 20;
    reasons.push('URLに"/detail/"が含まれる');
  }
  
  // タイトル判定（0-30点）
  const titleKeywords = ['求人', '採用', '募集', 'job', 'career', 'recruit'];
  const matchedTitleKeyword = titleKeywords.find(k => title.includes(k));
  if (matchedTitleKeyword) {
    score += 30;
    reasons.push(`タイトルに"${matchedTitleKeyword}"が含まれる`);
  }
  
  // 本文判定（0-40点）
  const contentKeywords = ['年収', '給与', '勤務地', '応募', '資格', '経験'];
  const matchedContentKeywords = contentKeywords.filter(k => content.includes(k));
  score += matchedContentKeywords.length * 5;
  if (matchedContentKeywords.length > 0) {
    reasons.push(`本文に求人関連キーワードが${matchedContentKeywords.length}個含まれる`);
  }
  
  // 一覧ページの除外（-50点）
  if (/一覧|list|search|検索結果/i.test(url) || /一覧|list|search|検索結果/i.test(title)) {
    score -= 50;
    reasons.push('一覧ページの可能性が高い');
  }
  
  // 非求人ページの除外（-50点）
  const nonJobPatterns = [
    /\/company\//i, /\/ir\//i, /\/about\//i, /\/contact\//i,
    /\/privacy\//i, /\/terms\//i, /\/login\//i, /\/signup\//i
  ];
  if (nonJobPatterns.some(pattern => pattern.test(url))) {
    score -= 50;
    reasons.push('非求人ページの可能性が高い');
  }
  
  const pageType = score >= 30 ? 'job_detail' : 
                   score >= 0 ? 'job_list' : 'non_job';
  
  return { score, pageType, reasons };
}

// route.tsで使用
const { score, pageType, reasons } = calculateJobPageScore(validatedUrl, title, content || "");

// pageTypeごとの挙動
if (pageType === 'non_job') {
  // デフォルトは保存しない（ユーザーが「強制保存」を選択した場合のみ保存）
  const forceSave = (await request.json()).forceSave || false;
  if (!forceSave) {
    return NextResponse.json(
      { 
        error: "このページは求人詳細ページではない可能性があります。",
        pageType,
        reasons,
        canForceSave: true // 強制保存可能フラグ
      },
      { status: 400 }
    );
  }
}

// Firestore保存時にpageTypeを付与
await addDoc(collection(db, "jobs"), {
  // ... 既存フィールド ...
  pageType,
  pageTypeScore: score, // デバッグ用
  isListPage: pageType === 'job_list', // 一覧ページフラグ
});
```

**根拠**: サーバー側で最終判定することで、悪用や誤判定を防ぐ。pageTypeごとの挙動を仕様化することで、UXと運用の両方を改善。

#### 5. ログの個人情報マスキング
**ファイル**: [app/api/jobs/capture/route.ts](app/api/jobs/capture/route.ts)

**変更内容**:
- `console.log`で本文全文を出力している箇所（65行）を修正
- 本文は最初の100文字のみ、またはマスキング

**実装案**:
```typescript
// ログ出力時のマスキング
function safeLog(message: string, data: any) {
  const masked = {
    ...data,
    content: data.content ? `${data.content.substring(0, 100)}...` : null,
    url: maskUrl(data.url)
  };
  console.log(message, masked);
}

function maskUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}/***`;
  } catch {
    return '***';
  }
}
```

### P1: 審査突破確率向上

#### 6. CORS制限の改善
**ファイル**: [app/api/jobs/capture/route.ts](app/api/jobs/capture/route.ts)

**変更内容**:
- `Access-Control-Allow-Origin: *`を削除
- 拡張機能IDを環境変数で指定し、特定の拡張機能のみ許可（補助的な対策）
- 最終防衛は認証で行う

**実装案**:
```typescript
const allowedOrigin = process.env.EXTENSION_ID 
  ? `chrome-extension://${process.env.EXTENSION_ID}`
  : '*'; // 開発環境のみ

response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
```

#### 7. 拡張機能側の認証トークン取得（chrome.storage.local使用）
**ファイル**: [chrome-extension/popup.js](chrome-extension/popup.js), [chrome-extension/manifest.json](chrome-extension/manifest.json)

**変更内容**:
- 簡易認証方式: Webアプリでログイン後、トークンを発行
- 拡張機能の設定画面（または初回使用時）でトークンを入力
- **トークンを`chrome.storage.local`に保存**（localStorageではなく）
- API呼び出し時に送信

**manifest.jsonにstorage権限を追加**:
```json
{
  "permissions": ["activeTab", "scripting", "storage"]
}
```

**実装案**:
```javascript
// トークン取得（chrome.storage.localから）
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['auth_token'], (result) => {
      resolve(result.auth_token || null);
    });
  });
}

// トークン保存
async function saveAuthToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ auth_token: token }, () => {
      resolve();
    });
  });
}

// saveToFirestore()でトークンを送信
const token = await getAuthToken();
const response = await fetch(API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  },
  body: JSON.stringify(data)
});
```

**注意事項**:
- 「トークン入力式」はMVPとして現実的だが、審査文言・プライバシーポリシーで「ユーザーが自分で発行して貼る」「第三者に共有しない」などの注意が必要
- サポート負債も出やすいため、将来的にはFirebase Auth SDKの統合を検討

**代替案（より簡易）**: 
- 匿名ユーザーも許可し、IPベースのレート制限のみで保護
- 認証は任意（オプション機能）

### P2: 後で良いが効く改善

#### 8. 本文抽出の改善（優先抽出）
**ファイル**: [chrome-extension/popup.js](chrome-extension/popup.js)

**変更内容**:
- 見出しベースでセクション分割
- 重要キーワード（年収、勤務地、応募要件）を含むセクションを優先抽出
- 文字数制限内で重要情報が切れないようにする

#### 9. ストア申請用の説明・同意・削除（審査ドキュメント整備）
**ファイル**: 新規作成（プライバシーポリシー、ストア掲載文等）

**変更内容**:

**9-1. プライバシーポリシーの作成**

**ファイル**: `docs/PRIVACY_POLICY.md`（新規作成）

**必須項目**:
- 収集する情報（URL、タイトル、本文）
- 収集目的（求人情報の保存・管理、AI抽出）
- 第三者提供（Google Gemini API、Firebase）
- データの保存期間（ユーザーが削除するまで）
- データの削除方法（Webアプリから削除可能）
- 問い合わせ先

**9-2. 拡張機能のポップアップ内に同意文言を追加**

**ファイル**: [chrome-extension/popup.html](chrome-extension/popup.html)

**実装案**:
```html
<div id="consent" style="display: none; padding: 8px; background: #f0f9ff; border-radius: 4px; margin-top: 8px; font-size: 11px; color: #1e40af;">
  <p>このボタンをクリックすると、ページのURL、タイトル、本文が送信され、AIで求人情報が抽出されます。</p>
  <p style="margin-top: 4px;"><a href="https://job-seiri.netlify.app/privacy-policy" target="_blank">プライバシーポリシー</a></p>
</div>
```

**9-3. ストア掲載文の作成**

**ファイル**: `docs/STORE_DESCRIPTION.md`（新規作成）

**必須記載事項**:
- 送信するデータ（URL、タイトル、本文）
- 送信タイミング（ボタンクリック時のみ）
- 用途（求人情報の保存・管理、AI抽出）
- 削除方法（Webアプリから削除可能）
- データの取り扱い（プライバシーポリシーへのリンク）

**9-4. 削除機能の確認と改善**

**ファイル**: [components/JobCard.tsx](components/JobCard.tsx), [components/JobList.tsx](components/JobList.tsx)

**確認事項**:
- 削除機能は既に実装済み（JobCard.tsx:129-151, JobList.tsx:186-212）
- Data safety申告との整合性を確認
- 削除時の確認ダイアログが適切か確認
- **削除導線が明確か確認**（どこから削除できるかがユーザーに分かるか）

**改善案**:
- 削除ボタンのラベルを明確化（「アーカイブ」「完全削除」）
- 削除後の確認メッセージを表示
- プライバシーポリシーに「削除方法」を明記

## テスト観点

### 手動テスト項目

1. **host_permissions削除後の動作確認**
   - 各種求人サイト（リクルート、マイナビ、doda、Green、Wantedly等）で保存ボタンが動作するか
   - `chrome.scripting.executeScript`が正常に実行されるか
   - エラーメッセージが適切に表示されるか

2. **注入不可ページの例外処理確認**
   - `chrome://` ページで適切なエラーメッセージが表示されるか
   - PDFページで適切なエラーメッセージが表示されるか
   - iframe内ページで適切に処理されるか
   - ログイン後のマイページで警告が表示されるか

3. **データ送信の確認**
   - `htmlStructure`が送信されていないか（Networkタブで確認）
   - `metaTags`が最小化されているか（og:title, og:descriptionのみ、または送信なし）
   - 本文が20,000文字以内に制限されているか

4. **認証・レート制限の確認**
   - 認証なしでリクエストした場合、適切にエラーが返るか（または匿名許可の場合、レート制限が効くか）
   - レート制限（10件/分）が正常に動作するか（Upstash RedisまたはFirestoreカウンタ）
   - Gemini API呼び出しのレート制限（5件/分）が正常に動作するか

5. **求人ページ判定の確認**
   - 求人詳細ページで`pageType: 'job_detail'`が設定されるか
   - 一覧ページで`pageType: 'job_list'`が設定され、注意ラベルが表示されるか
   - 非求人ページで`pageType: 'non_job'`が設定され、エラーが返るか
   - 強制保存オプションが動作するか

6. **プライバシーポリシー・同意UIの確認**
   - ポップアップ内に同意文言が表示されるか
   - プライバシーポリシーへのリンクが機能するか
   - 削除機能が正常に動作するか
   - 削除導線が明確か

## 実装順序

⚠️ **すべての実装は `test` ブランチで行います。`main` ブランチは絶対に変更しません。**

### 初回セットアップ
```bash
git checkout -b test
git push -u origin test
```

### 実装順序（P0優先）

1. **manifest.json修正**（host_permissions削除）
2. **popup.js修正**（htmlStructure送信停止、metaTags最小化、注入不可ページの例外処理）
3. **レート制限実装**（Upstash RedisまたはFirestoreカウンタ、lib/rateLimit.ts作成）
4. **API認証・レート制限統合**（app/api/jobs/capture/route.ts修正）
5. **求人ページ判定実装**（lib/jobPageDetector.ts作成、route.ts統合）
6. **ログマスキング実装**（lib/safeLog.ts作成、route.ts修正）
7. **CORS制限改善**（route.ts修正）
8. **拡張機能側認証トークン取得**（popup.js修正、manifest.jsonにstorage権限追加）
9. **プライバシーポリシー・ストア掲載文作成**（docs/PRIVACY_POLICY.md、docs/STORE_DESCRIPTION.md）
10. **同意UI追加**（popup.html修正）
11. **削除機能確認・改善**（JobCard.tsx、JobList.tsx確認）
12. **テスト実施**（すべての手動テスト項目を確認）

## 審査で突っ込まれそうな説明ポイント

### 1. 権限について
**質問**: なぜ`activeTab`と`scripting`だけで動作するのか？
**回答**: ユーザーが拡張機能アイコンをクリックした時点で、そのタブの情報にアクセスできます。`activeTab`権限により、ユーザーが明示的に操作したタブのみにアクセス可能です。全サイトへのアクセス権限は不要です。

### 2. データ送信について
**質問**: なぜ`htmlStructure`を送信しないのか？
**回答**: 求人情報の抽出には本文テキストで十分です。HTML構造には個人情報が混入する可能性があり、プライバシー保護の観点から送信を停止しました。

**質問**: `metaTags`はなぜ最小化（または送信しない）なのか？
**回答**: タイトル補完と重複排除にのみ使用します。`og:title`と`og:description`のみを送信し、個人情報を含む可能性のある他のメタタグは送信しません（または送信しません）。

### 3. 認証について
**質問**: 認証なしでデータを保存できるのか？
**回答**: 簡易トークン方式または匿名ユーザー方式を採用し、IPベースのレート制限で保護しています。本番環境ではFirebase Admin SDKによる認証を推奨します。

### 4. レート制限について
**質問**: サーバレス環境でレート制限は効くのか？
**回答**: Upstash Redis（またはFirestoreカウンタ）を使用して、サーバレス環境でも共有カウンタでレート制限を実装しています。メモリベースのレート制限は使用していません。

### 5. 求人ページ判定について
**質問**: 誤って非求人ページを保存した場合の対処は？
**回答**: サーバー側で求人ページ判定を行い、非求人ページの場合はエラーを返します。ユーザーは「強制保存」オプションを選択することで保存可能ですが、デフォルトでは保存しません。ユーザーはWebアプリから手動で削除できます。

### 6. 削除機能について
**質問**: ユーザーは自分のデータを削除できるのか？
**回答**: はい。Webアプリの求人カードから「アーカイブ」または「完全削除」ボタンで削除できます。プライバシーポリシーにも削除方法を明記しています。

## 注意事項

- `htmlStructure`送信停止により、Gemini APIの抽出精度が低下する可能性があります。実装後、精度を確認し、必要に応じて本文抽出ロジックを改善してください。
- レート制限はUpstash Redis（またはFirestoreカウンタ）を使用します。メモリベースのレート制限はサーバレス環境では効きません。
- 認証方式は簡易版のため、本番環境ではFirebase Admin SDKによる認証を推奨します。
- すべての変更は`test`ブランチで行い、`main`ブランチは絶対に変更しません。
 