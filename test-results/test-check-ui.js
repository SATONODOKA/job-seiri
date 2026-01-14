const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 実際の画面を確認中...\n');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    
    // ログイン
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (emailInput && passwordInput && submitButton) {
      await emailInput.fill('nodoka.sato.bliss@gmail.com');
      await passwordInput.fill('Sandwichman0418');
      await submitButton.click();
      await page.waitForTimeout(5000);
    }
    
    // JobCardを確認
    await page.waitForSelector('.bg-white.rounded-xl.border', { timeout: 10000 });
    const jobCards = await page.$$('.bg-white.rounded-xl.border');
    console.log(`見つかったJobCard数: ${jobCards.length}\n`);
    
    // 最初の5つのJobCardを確認
    console.log('=== 画面表示確認 ===\n');
    for (let i = 0; i < Math.min(5, jobCards.length); i++) {
      const card = jobCards[i];
      const h3 = await card.$('h3');
      if (h3) {
        const title = await h3.textContent();
        const salarySpans = await card.$$('span.bg-blue-100');
        const salaryText = salarySpans.length > 0 ? await salarySpans[0].textContent() : 'なし';
        
        console.log(`JobCard[${i}]:`);
        console.log(`  タイトル: ${title}`);
        console.log(`  年収帯: ${salaryText}`);
        
        // freeeの確認
        if (title.includes('フリー') || title.includes('freee')) {
          console.log(`  ✅ freeeの求人を発見！`);
          const hasCompanyName = title.includes('：') && title.split('：')[0].includes('フリー');
          console.log(`  会社名表示: ${hasCompanyName ? '✅ 正しく表示' : '❌ 表示されていない'}`);
        }
        console.log('');
      }
    }
    
    // 最初のJobCardを展開してURLを確認
    console.log('=== URLバリデーション確認 ===\n');
    const firstCard = jobCards[0];
    await firstCard.click();
    await page.waitForTimeout(500);
    
    const link = await firstCard.$('a[href^="http"]');
    const disabledButton = await firstCard.$('button[disabled]');
    
    if (link) {
      const href = await link.getAttribute('href');
      console.log(`✅ 有効なURLリンク: ${href}`);
    } else if (disabledButton) {
      const title = await disabledButton.getAttribute('title');
      console.log(`⚠️ 無効なURL（disabledボタン）: ${title}`);
    } else {
      console.log('❌ リンクもボタンも見つかりません');
    }
    
    // スクリーンショットを保存
    await page.screenshot({ path: 'test-results/screenshot-current-ui.png', fullPage: true });
    console.log('\n📸 スクリーンショットを保存: test-results/screenshot-current-ui.png');
    
    // 5秒待機
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ エラー:', error);
    await page.screenshot({ path: 'test-results/screenshot-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ 確認完了');
  }
})();
