// Firebase設定
// config.jsで定義された FIREBASE_CONFIG を利用可能ですが、
// APIルート経由に変更したため、ここでは直接使用しません。

// 優先抽出: 見出しベースでセクション分割し、重要キーワードを含むセクションを優先
function extractWithPriority(element) {
  const sections = [];
  const importantKeywords = ['年収', '給与', '勤務地', '応募', '資格', '経験', '要件', '必須', '歓迎'];
  
  // 見出しを探す
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  if (headings.length === 0) {
    // 見出しがない場合は通常の抽出
    return getCleanText(element);
  }
  
  // 見出しごとにセクションを抽出
  headings.forEach((heading, index) => {
    let sectionText = '';
    let nextHeading = headings[index + 1];
    
    // 現在の見出しから次の見出しまでのテキストを取得
    let current = heading.nextSibling;
    while (current && current !== nextHeading) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        sectionText += getCleanText(current) + ' ';
      } else if (current.nodeType === Node.TEXT_NODE) {
        sectionText += current.textContent + ' ';
      }
      current = current.nextSibling;
    }
    
    // 見出しテキストも追加
    const headingText = getCleanText(heading);
    sectionText = headingText + ' ' + sectionText.trim();
    
    // 重要キーワードの数をカウント
    const keywordCount = importantKeywords.filter(k => sectionText.includes(k)).length;
    const priority = keywordCount * 10 + sectionText.length; // キーワード数と長さで優先度を計算
    
    if (sectionText.length > 50) { // 最小50文字のセクションのみ
      sections.push({ text: sectionText, priority });
    }
  });
  
  // 優先度順にソート
  sections.sort((a, b) => b.priority - a.priority);
  
  // 上限まで優先度の高いセクションを結合
  let result = '';
  for (const section of sections) {
    if (result.length + section.text.length > 20000) {
      // 残り文字数を計算して、可能な限り追加
      const remaining = 20000 - result.length;
      if (remaining > 100) { // 100文字以上残っている場合のみ追加
        result += section.text.substring(0, remaining);
      }
      break;
    }
    result += section.text + '\n\n';
  }
  
  // セクションが少ない場合は、通常の抽出も追加
  if (result.length < 5000) {
    const fallbackText = getCleanText(element);
    const remaining = 20000 - result.length;
    if (remaining > 0) {
      result += '\n\n' + fallbackText.substring(0, remaining);
    }
  }
  
  return result.trim();
}

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
    
    // クリーンなテキストを取得（優先抽出方式）
    let textContent = '';
    
    try {
      // 優先抽出: 見出しベースでセクション分割し、重要キーワードを含むセクションを優先
      textContent = extractWithPriority(contentElement);
    } catch (e) {
      console.warn('extractWithPriority failed, using fallback:', e);
      try {
        textContent = getCleanText(contentElement);
      } catch (e2) {
        console.warn('getCleanText failed, using fallback:', e2);
        textContent = (contentElement.textContent || contentElement.innerText || '').substring(0, 20000);
      }
    }
    
    // 文字数制限（20,000文字）
    if (textContent.length > 20000) {
      textContent = textContent.substring(0, 20000);
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
  // chrome.storageが利用可能かチェック
  if (!chrome || !chrome.storage || !chrome.storage.local) {
    console.warn('chrome.storage.local is not available, returning null');
    return null;
  }

  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(['auth_token'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting auth token:', chrome.runtime.lastError);
          resolve(null);
        } else {
          resolve(result.auth_token || null);
        }
      });
    } catch (error) {
      console.error('Error accessing chrome.storage.local:', error);
      resolve(null);
    }
  });
}

// Firestore REST APIで保存
async function saveToFirestore(data) {
  // Next.js APIルートを呼び出す
  // Chrome拡張機能のpopupではwindow.location.hostnameが使えないため、
  // 設定ファイル（config.js）でAPI_URLが指定されている場合はそれを使用
  // デフォルトは本番環境（Netlify）
  let API_URL = "https://kyujin-bookmark.netlify.app/api/jobs/capture";
  
  // 設定ファイルからAPI_URLを読み込む（存在する場合）
  if (typeof window !== 'undefined' && window.API_URL) {
    API_URL = window.API_URL;
    console.log("config.jsからAPI_URLを読み込み:", API_URL);
  } else {
    console.log("デフォルトのAPI_URL（本番環境）を使用:", API_URL);
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
      errorMessage = "サーバーに接続できません。\n\n確認事項:\n1. インターネット接続を確認してください\n2. サーバーが正常に動作しているか確認してください\n3. しばらく待ってから再試行してください";
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
          errorMessage = "APIエンドポイントが見つかりません。サーバーの設定を確認してください。";
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
