// Firebase設定
// config.jsで定義された FIREBASE_CONFIG を利用可能ですが、
// APIルート経由に変更したため、ここでは直接使用しません。

// HTMLタグを除去してテキストのみを取得する関数
function getCleanText(element) {
  try {
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
  } catch (e) {
    // エラーが発生した場合は、シンプルにtextContentを使用
    try {
      return (element.textContent || element.innerText || '').replace(/\s+/g, ' ').trim();
    } catch (e2) {
      return '';
    }
  }
}

// HTML構造から不要な要素を除去する関数
// 審査で説明が困難なため、htmlStructureの送信を停止したため、この関数は使用しない
/*
function getCleanHTML(element) {
  try {
    const clone = element.cloneNode(true);
    
    // スクリプト、スタイル、noscriptを除去
    const toRemove = clone.querySelectorAll('script, style, noscript, iframe, embed, object');
    toRemove.forEach(el => el.remove());
    
    // コメントを除去
    try {
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
    } catch (e) {
      // TreeWalkerが失敗した場合はスキップ
      console.warn('TreeWalker failed:', e);
    }
    
    return clone.innerHTML;
  } catch (e) {
    // エラーが発生した場合は、シンプルにinnerHTMLを使用（スクリプトタグのみ除去）
    try {
      const html = element.innerHTML || '';
      return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                 .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    } catch (e2) {
      return '';
    }
  }
}
*/

// ページ情報を取得する関数（タブ内で実行される）
function getPageInfo() {
  try {
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
          try {
            // クリーンなテキストを取得して評価
            const cleanText = getCleanText(el);
            const textLength = cleanText.length;
            
            // ナビゲーションやフッターを除外（テキストが短すぎる、またはリンクが多い）
            const linkCount = el.querySelectorAll('a').length;
            const linkRatio = linkCount / Math.max(textLength, 1);
            
            // HTMLタグが多く含まれている場合は除外（タグの比率が高い）
            const htmlLength = (el.innerHTML || '').length;
            const tagRatio = htmlLength > 0 ? (htmlLength - textLength) / htmlLength : 0;
            
            // 最小500文字、リンク比率30%未満、タグ比率50%未満の要素を優先
            if (textLength > maxTextLength && 
                textLength > 500 && 
                linkRatio < 0.3 && 
                tagRatio < 0.5) {
              maxTextLength = textLength;
              bestElement = el;
            }
          } catch (e) {
            // 個別の要素処理でエラーが発生した場合はスキップ
            console.warn('Error processing element:', e);
          }
        });
      } catch (e) {
        // セレクターが無効な場合はスキップ
        console.warn('Invalid selector:', selector, e);
      }
    }
    
    // 最適な要素が見つからない場合はbodyを使用
    const contentElement = bestElement || document.body;
    
    // クリーンなテキストを取得
    let textContent = '';
    
    try {
      textContent = getCleanText(contentElement);
    } catch (e) {
      console.warn('getCleanText failed, using fallback:', e);
      textContent = (contentElement.textContent || contentElement.innerText || '').substring(0, 20000);
    }
    
    // メタデータを最小化（送信しない、またはog:title/og:descriptionのみ）
    // MVPでは送信しない方針
    const metaTags = [];
    
    return {
      url: window.location.href,
      title: document.title,
      content: textContent.substring(0, 20000),
      // htmlStructure: 削除（審査で説明が困難なため）
      metaTags: metaTags // 最小化（空配列）
    };
  } catch (error) {
    // 全体でエラーが発生した場合でも、最低限の情報を返す
    console.error('getPageInfo error:', error);
    return {
      url: window.location.href,
      title: document.title,
      content: (document.body?.textContent || document.body?.innerText || '').substring(0, 20000),
      // htmlStructure: 削除
      metaTags: []
    };
  }
}

// 認証トークンを取得（chrome.storage.localから）
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['auth_token'], (result) => {
      resolve(result.auth_token || null);
    });
  });
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

  // 認証トークンを取得
  const token = await getAuthToken();
  
  // htmlStructureを送信データから削除
  const requestData = {
    url: data.url,
    title: data.title,
    content: data.content,
    // htmlStructure: 削除（審査で説明が困難なため）
    metaTags: data.metaTags || []
  };

  console.log("API_URL:", API_URL);
  console.log("Request data (htmlStructure removed):", requestData);
  
  let response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      },
      body: JSON.stringify(requestData)
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

    // ページ内でスクリプトを実行してページ情報を取得
    status.textContent = "ページ情報を取得中...";
    let results;
    try {
      results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getPageInfo
      });
    } catch (scriptError) {
      console.error('Script execution error:', scriptError);
      // 注入失敗時の詳細なエラーメッセージ
      if (scriptError.message && scriptError.message.includes('Cannot access')) {
        throw new Error("このページでは情報を取得できません。\n\n理由: ページのセキュリティ設定により、拡張機能がアクセスできません。\n\n対処: 通常のWebページ（http:// または https:// で始まるページ）でお試しください。");
      }
      throw new Error(`スクリプト実行エラー: ${scriptError.message || '不明なエラー'}`);
    }

    if (!results || results.length === 0) {
      throw new Error("スクリプト実行結果が空です");
    }

    if (!results[0] || !results[0].result) {
      const errorDetails = results[0]?.error || '不明なエラー';
      console.error('Script result error:', errorDetails);
      throw new Error(`ページ情報を取得できませんでした: ${errorDetails}`);
    }

    const pageInfo = results[0].result;
    
    // 最低限の情報が取得できているか確認
    if (!pageInfo.url || !pageInfo.title) {
      throw new Error("URLまたはタイトルが取得できませんでした");
    }
    
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
