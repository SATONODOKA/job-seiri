// Firebase設定
// config.jsで定義された FIREBASE_CONFIG を利用可能ですが、
// APIルート経由に変更したため、ここでは直接使用しません。

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
  // Next.js APIルートを呼び出す
  // Next.js APIルートを呼び出す
  // 本番環境のURL（開発時はlocalhostに書き換えてください）
  const API_URL = "https://job-seiri.netlify.app/api/jobs/capture";

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("API error:", errorData);
    throw new Error(errorData.error || "保存に失敗しました");
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
