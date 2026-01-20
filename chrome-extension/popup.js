// Firebase設定
// config.jsで定義された FIREBASE_CONFIG を利用可能ですが、
// APIルート経由に変更したため、ここでは直接使用しません。

// HTMLタグを除去してテキストのみを取得する関数
function getCleanText(element) {
  // まず、スクリプトとスタイルタグを除去したクローンを作成
  const clone = element.cloneNode(true);
  const scripts = clone.querySelectorAll('script, style, noscript');
  scripts.forEach(el => el.remove());
  
  // innerTextを試す（レンダリングされたテキストを取得）
  let text = clone.innerText || '';
  
  // innerTextが空またはHTMLタグが含まれている場合は、textContentを使用
  if (!text || text.includes('<') || text.length < 10) {
    text = clone.textContent || '';
  }
  
  // まだHTMLタグが含まれている場合は、正規表現で除去
  if (text.includes('<')) {
    text = text.replace(/<[^>]*>/g, '');
  }
  
  // 連続する空白や改行を整理
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

// HTML構造から不要な要素を除去する関数
function getCleanHTML(element) {
  const clone = element.cloneNode(true);
  
  // スクリプト、スタイル、noscriptを除去
  const toRemove = clone.querySelectorAll('script, style, noscript, iframe, embed, object');
  toRemove.forEach(el => el.remove());
  
  // コメントを除去
  const walker = document.createTreeWalker(
    clone,
    NodeFilter.SHOW_COMMENT,
    null,
    false
  );
  const comments = [];
  let node;
  while (node = walker.nextNode()) {
    comments.push(node);
  }
  comments.forEach(comment => comment.remove());
  
  return clone.innerHTML;
}

// ページ情報を取得する関数（タブ内で実行される）
function getPageInfo() {
  // 複数の候補セレクターを定義
  const candidateSelectors = [
    'main',
    'article',
    '[role="main"]',
    '[class*="job"]',
    '[class*="content"]',
    '[class*="description"]',
    '[id*="content"]',
    '[id*="main"]',
    '[id*="job"]',
    'section',
    '.container',
    '#container',
    'table', // テーブル構造のサイトにも対応
    '[class*="detail"]',
    '[class*="posting"]'
  ];
  
  // 各セレクターで要素を取得し、テキスト量を評価
  let bestElement = null;
  let maxTextLength = 0;
  
  for (const selector of candidateSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // クリーンなテキストを取得して評価
        const cleanText = getCleanText(el);
        const textLength = cleanText.length;
        
        // ナビゲーションやフッターを除外（テキストが短すぎる、またはリンクが多い）
        const linkCount = el.querySelectorAll('a').length;
        const linkRatio = linkCount / Math.max(textLength, 1);
        
        // HTMLタグが多く含まれている場合は除外（タグの比率が高い）
        const htmlLength = el.innerHTML.length;
        const tagRatio = (htmlLength - textLength) / Math.max(htmlLength, 1);
        
        // 最小500文字、リンク比率30%未満、タグ比率50%未満の要素を優先
        if (textLength > maxTextLength && 
            textLength > 500 && 
            linkRatio < 0.3 && 
            tagRatio < 0.5) {
          maxTextLength = textLength;
          bestElement = el;
        }
      });
    } catch (e) {
      // セレクターが無効な場合はスキップ
      console.warn('Invalid selector:', selector, e);
    }
  }
  
  // 最適な要素が見つからない場合はbodyを使用
  const contentElement = bestElement || document.body;
  
  // クリーンなテキストとHTML構造を取得
  const textContent = getCleanText(contentElement);
  const htmlContent = getCleanHTML(contentElement);
  
  // メタデータも取得
  const metaTags = Array.from(document.querySelectorAll('meta')).map(meta => ({
    name: meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('itemprop'),
    content: meta.getAttribute('content')
  })).filter(m => m.name && m.content);
  
  return {
    url: window.location.href,
    title: document.title,
    content: textContent.substring(0, 20000), // 文字数制限を緩和
    htmlStructure: htmlContent.substring(0, 50000), // HTML構造も含める（クリーンアップ済み）
    metaTags: metaTags
  };
}

// Firestore REST APIで保存
async function saveToFirestore(data) {
  // Next.js APIルートを呼び出す
  // 開発環境と本番環境の判定
  // Chrome拡張機能のpopupではwindow.location.hostnameが使えないため、
  // 設定ファイル（config.js）でAPI_URLが指定されている場合はそれを使用
  // デフォルトは開発環境（localhost:3001 - package.jsonのdevスクリプトに合わせる）
  let API_URL = "http://localhost:3001/api/jobs/capture";
  
  // 設定ファイルからAPI_URLを読み込む（存在する場合）
  if (typeof window !== 'undefined' && window.API_URL) {
    API_URL = window.API_URL;
    console.log("config.jsからAPI_URLを読み込み:", API_URL);
  } else {
    console.log("デフォルトのAPI_URLを使用:", API_URL);
  }

  console.log("API_URL:", API_URL);
  console.log("Request data:", data);
  
  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch (fetchError) {
    // fetch自体が失敗した場合（ネットワークエラー、CORSエラーなど）
    console.error("Fetch error:", fetchError);
    let errorMessage = "ネットワークエラーが発生しました。";
    
    if (fetchError.message.includes("Failed to fetch") || fetchError.message.includes("NetworkError")) {
      errorMessage = "開発サーバーに接続できません。\n\n確認事項:\n1. 開発サーバーが起動しているか (npm run dev)\n2. ポート番号が正しいか (localhost:3001)\n3. ファイアウォール設定を確認";
    } else if (fetchError.message.includes("CORS")) {
      errorMessage = "CORSエラーが発生しました。サーバー側のCORS設定を確認してください。";
    } else {
      errorMessage = `接続エラー: ${fetchError.message}`;
    }
    
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    // レスポンスのContent-Typeを確認
    const contentType = response.headers.get("content-type");
    let errorMessage = "保存に失敗しました";
    
    try {
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        // HTMLやテキストの場合は、テキストとして読み取る
        const errorText = await response.text();
        console.error("API error (non-JSON):", errorText.substring(0, 200));
        // HTMLエラーページの場合は、ステータスコードから判断
        if (response.status === 404) {
          errorMessage = "APIエンドポイントが見つかりません。開発サーバーが起動しているか確認してください。";
        } else if (response.status === 500) {
          errorMessage = "サーバーエラーが発生しました。";
        } else {
          errorMessage = `エラーが発生しました (ステータス: ${response.status})`;
        }
      }
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      errorMessage = `エラーが発生しました (ステータス: ${response.status})`;
    }
    
    throw new Error(errorMessage);
  }
  
  // 成功時もContent-Typeを確認
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  } else {
    // JSONでない場合は、テキストとして読み取る
    const text = await response.text();
    console.warn("API returned non-JSON response:", text.substring(0, 200));
    return { success: true, message: text };
  }
}

// 保存ボタン
document.getElementById("saveBtn").addEventListener("click", async () => {
  const btn = document.getElementById("saveBtn");
  const status = document.getElementById("status");

  btn.disabled = true;
  btn.textContent = "保存中...";
  status.textContent = "ページ情報を取得中...";
  status.className = "processing";

  try {
    // 現在のタブを取得
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // chrome://やedge://などの特殊ページでは動作しない
    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
      throw new Error("このページでは使用できません");
    }

    // ページ内でスクリプトを実行してページ情報を取得
    status.textContent = "ページ情報を取得中...";
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageInfo
    });

    if (!results || results.length === 0 || !results[0].result) {
      throw new Error("ページ情報を取得できませんでした");
    }

    const pageInfo = results[0].result;
    
    // URLのバリデーション（無効なURLの場合はエラー）
    try {
      const urlObj = new URL(pageInfo.url);
      // 正規化されたURLを使用
      pageInfo.url = urlObj.href;
    } catch (error) {
      throw new Error(`無効なURL形式です: ${pageInfo.url}`);
    }

    // 求人情報を抽出・保存（LLM処理も含む）
    status.textContent = "求人情報を抽出中...\n（LLMで整形中）";
    status.className = "processing";
    await saveToFirestore(pageInfo);

    status.textContent = "✅ 保存しました!\n（LLMで整形済み）";
    status.className = "";
  } catch (error) {
    console.error(error);
    // エラーメッセージを表示（改行を含む場合は複数行で表示）
    const errorMsg = error.message;
    status.textContent = "エラー: " + errorMsg;
    status.className = "error";
    status.style.whiteSpace = "pre-line"; // 改行を保持
    console.error("保存エラー:", error);
  } finally {
    btn.disabled = false;
    btn.textContent = "この求人を保存";
  }
});
