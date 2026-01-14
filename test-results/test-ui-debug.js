const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    console.log('ページにアクセス中...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    
    // ログインフォームを探す
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (emailInput && passwordInput && submitButton) {
      console.log('ログインフォームが見つかりました。ログインを試みます...');
      
      await emailInput.fill('nodoka.sato.bliss@gmail.com');
      await passwordInput.fill('Sandwichman0418');
      await submitButton.click();
      
      // ログイン後のページ読み込みを待つ
      await page.waitForTimeout(5000);
      await page.waitForSelector('.bg-white.rounded-xl', { timeout: 10000 }).catch(() => {
        console.log('JobCardが見つかりません。もう少し待機します...');
      });
    }
    
    // スクリーンショットを撮る
    await page.screenshot({ path: 'test-results/screenshot-after-login.png', fullPage: true });
    console.log('スクリーンショットを保存: test-results/screenshot-after-login.png');
    
    // JobCardを探す
    const jobCards = await page.$$('.bg-white.rounded-xl.border');
    console.log(`見つかったJobCard数: ${jobCards.length}`);
    
    if (jobCards.length > 0) {
      // 最初の3つのJobCardの内容を確認
      for (let i = 0; i < Math.min(3, jobCards.length); i++) {
        const card = jobCards[i];
        const cardText = await card.textContent();
        console.log(`\n=== JobCard[${i}]の内容 ===`);
        console.log(cardText);
        
        // h3タグの内容を確認（タイトル部分）
        const h3Elements = await card.$$('h3');
        if (h3Elements.length > 0) {
          const h3Text = await h3Elements[0].textContent();
          console.log(`\n  h3タグ（タイトル）: ${h3Text}`);
          
          // 会社名が表示されているか確認
          const hasCompanyName = h3Text.includes('株式会社') || h3Text.includes('合同会社') || h3Text.includes('：');
          console.log(`  会社名が表示されている: ${hasCompanyName ? '✅' : '❌'}`);
        }
        
        // 年収帯のspan要素を確認
        const salarySpans = await card.$$('span.bg-blue-100');
        console.log(`  年収帯のspan要素数: ${salarySpans.length}`);
        for (let j = 0; j < salarySpans.length; j++) {
          const spanText = await salarySpans[j].textContent();
          console.log(`    span[${j}]: ${spanText}`);
        }
        
        // 年収帯が表示されているか確認
        const hasSalaryBand = cardText.includes('万円') || cardText.includes('〜500') || 
                             cardText.includes('500-700') || cardText.includes('700-900') || 
                             cardText.includes('900+');
        console.log(`  年収帯が表示されている: ${hasSalaryBand ? '✅' : '❌'}`);
      }
    } else {
      console.log('JobCardが見つかりませんでした。');
    }
    
    // コンソールログを確認
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('JobCard') || text.includes('Debug') || text.includes('Extracted') || msg.type() === 'error') {
        consoleMessages.push(`[${msg.type()}]: ${text}`);
      }
    });
    
    // 5秒待ってから終了
    await page.waitForTimeout(5000);
    
    if (consoleMessages.length > 0) {
      console.log('\n=== ブラウザコンソールメッセージ ===');
      consoleMessages.forEach(msg => console.log(msg));
    }
    
  } catch (error) {
    console.error('エラー:', error);
    await page.screenshot({ path: 'test-results/screenshot-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
