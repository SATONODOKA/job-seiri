const fs = require('fs');

const API_URL = "http://localhost:3001/api/jobs/capture";

async function testRealData() {
  console.log("🧪 実際の求人データでのテスト開始\n");

  // テストケース1: freee データアナリスト
  console.log("📋 テストケース1: freee データアナリスト");
  console.log("─────────────────────────────────────────────────────────");
  
  const freeeContent = fs.readFileSync('reference/test.freee.md', 'utf-8');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: "https://herp.careers/v1/freee/jobs/analytics",
        title: "【エンジニアリング基盤本部】データアナリスト",
        content: freeeContent
      })
    });
    
    const result = await response.json();
    console.log("✅ 保存成功, ID:", result.id);
    console.log("");
  } catch (error) {
    console.error("❌ エラー:", error.message);
    console.log("");
  }

  // テストケース2: デロイト コンサルタント
  console.log("📋 テストケース2: デロイト コンサルタント");
  console.log("─────────────────────────────────────────────────────────");
  
  const deloitteContent = fs.readFileSync('reference/test.deloitte.md', 'utf-8');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: "https://deloitte.com/jobs/consulting",
        title: "合同会社デロイト トーマツ／コンサルティング Energy & Chemicals, Mining & Metals（エネルギー、素材化学、鉄鋼領域）",
        content: deloitteContent
      })
    });
    
    const result = await response.json();
    console.log("✅ 保存成功, ID:", result.id);
    console.log("");
  } catch (error) {
    console.error("❌ エラー:", error.message);
    console.log("");
  }

  // テストケース3: マネーフォワード プロダクトデザイナー
  console.log("📋 テストケース3: マネーフォワード プロダクトデザイナー");
  console.log("─────────────────────────────────────────────────────────");
  
  const mfContent = fs.readFileSync('reference/test.moneyforward.md', 'utf-8');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: "https://moneyforward.com/careers/product-designer",
        title: "【プロダクトデザイナー（UI/UX）_オープンポジション】_東京（田町）",
        content: mfContent
      })
    });
    
    const result = await response.json();
    console.log("✅ 保存成功, ID:", result.id);
    console.log("");
  } catch (error) {
    console.error("❌ エラー:", error.message);
    console.log("");
  }

  console.log("✅ テスト完了");
  console.log("ブラウザで http://localhost:3001 を開いて結果を確認してください");
}

// Node.js 18+ では fetch が標準で利用可能
testRealData().catch(console.error);
