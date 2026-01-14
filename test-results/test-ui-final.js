const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  
  try {
    console.log('ページにアクセス中...');
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
    
    // JobCardを探す
    await page.waitForSelector('.bg-white.rounded-xl.border', { timeout: 10000 });
    const jobCards = await page.$$('.bg-white.rounded-xl.border');
    console.log(`\n見つかったJobCard数: ${jobCards.length}`);
    
    // 最初の5つのJobCardを確認
    for (let i = 0; i < Math.min(5, jobCards.length); i++) {
      const card = jobCards[i];
      const h3 = await card.$('h3');
      if (h3) {
        const title = await h3.textContent();
        const salarySpans = await card.$$('span.bg-blue-100');
        const salaryText = salarySpans.length > 0 ? await salarySpans[0].textContent() : 'なし';
        
        console.log(`\nJobCard[${i}]:`);
        console.log(`  タイトル: ${title}`);
        console.log(`  年収帯: ${salaryText}`);
        console.log(`  会社名が表示されている: ${title.includes('：') && title.split('：')[0].length > 0 ? '✅' : '❌'}`);
      }
    }
    
    // コンソールログを確認
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('JobCard') || text.includes('Extraction') || msg.type() === 'error') {
        consoleLogs.push(`[${msg.type()}]: ${text}`);
      }
    });
    
    // 10秒待ってから終了（再抽出の完了を待つ）
    await page.waitForTimeout(10000);
    
    // 再度確認
    console.log('\n=== 10秒後の再確認 ===');
    const jobCardsAfter = await page.$$('.bg-white.rounded-xl.border');
    for (let i = 0; i < Math.min(3, jobCardsAfter.length); i++) {
      const card = jobCardsAfter[i];
      const h3 = await card.$('h3');
      if (h3) {
        const title = await h3.textContent();
        console.log(`JobCard[${i}] タイトル: ${title}`);
      }
    }
    
    if (consoleLogs.length > 0) {
      console.log('\n=== ブラウザコンソールメッセージ ===');
      consoleLogs.forEach(msg => console.log(msg));
    }
    
    await page.screenshot({ path: 'test-results/screenshot-final.png', fullPage: true });
    console.log('\nスクリーンショットを保存: test-results/screenshot-final.png');
    
  } catch (error) {
    console.error('エラー:', error);
    await page.screenshot({ path: 'test-results/screenshot-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
