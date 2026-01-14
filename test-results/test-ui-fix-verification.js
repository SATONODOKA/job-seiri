const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  
  try {
    console.log('📋 Phase 3.8 修正後のテスト開始...\n');
    console.log('ページにアクセス中...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    
    // ログイン
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (emailInput && passwordInput && submitButton) {
      console.log('ログインフォームが見つかりました。ログインを試みます...');
      await emailInput.fill('nodoka.sato.bliss@gmail.com');
      await passwordInput.fill('Sandwichman0418');
      await submitButton.click();
      await page.waitForTimeout(5000);
      console.log('✅ ログイン完了\n');
    }
    
    // JobCardを探す
    await page.waitForSelector('.bg-white.rounded-xl.border', { timeout: 10000 });
    const jobCards = await page.$$('.bg-white.rounded-xl.border');
    console.log(`見つかったJobCard数: ${jobCards.length}\n`);
    
    // テスト結果を記録
    const testResults = [];
    
    // 最初の10つのJobCardを確認
    for (let i = 0; i < Math.min(10, jobCards.length); i++) {
      const card = jobCards[i];
      const h3 = await card.$('h3');
      if (h3) {
        const title = await h3.textContent();
        const salarySpans = await card.$$('span.bg-blue-100');
        const salaryText = salarySpans.length > 0 ? await salarySpans[0].textContent() : 'なし';
        
        // 会社名が表示されているか確認
        const hasCompanyName = title.includes('：') && title.split('：')[0].length > 0;
        const hasJobTitle = title.includes('：') || title.length > 0;
        const hasSalaryBand = salaryText !== 'なし';
        
        const result = {
          index: i,
          title: title,
          salaryBand: salaryText,
          hasCompanyName: hasCompanyName,
          hasJobTitle: hasJobTitle,
          hasSalaryBand: hasSalaryBand,
          status: hasCompanyName && hasJobTitle && hasSalaryBand ? '✅' : '⚠️'
        };
        
        testResults.push(result);
        
        console.log(`JobCard[${i}]:`);
        console.log(`  タイトル: ${title}`);
        console.log(`  年収帯: ${salaryText}`);
        console.log(`  会社名が表示されている: ${hasCompanyName ? '✅' : '❌'}`);
        console.log(`  役職名が表示されている: ${hasJobTitle ? '✅' : '❌'}`);
        console.log(`  年収帯が表示されている: ${hasSalaryBand ? '✅' : '❌'}`);
        console.log(`  ステータス: ${result.status}\n`);
      }
    }
    
    // 再抽出の完了を待つ（15秒）
    console.log('⏳ 再抽出の完了を待機中（15秒）...\n');
    await page.waitForTimeout(15000);
    
    // 再度確認（再抽出後の状態）
    console.log('=== 再抽出後の再確認 ===\n');
    const jobCardsAfter = await page.$$('.bg-white.rounded-xl.border');
    const afterResults = [];
    
    for (let i = 0; i < Math.min(5, jobCardsAfter.length); i++) {
      const card = jobCardsAfter[i];
      const h3 = await card.$('h3');
      if (h3) {
        const title = await h3.textContent();
        const salarySpans = await card.$$('span.bg-blue-100');
        const salaryText = salarySpans.length > 0 ? await salarySpans[0].textContent() : 'なし';
        
        const hasCompanyName = title.includes('：') && title.split('：')[0].length > 0;
        const hasSalaryBand = salaryText !== 'なし';
        
        afterResults.push({
          index: i,
          title: title,
          salaryBand: salaryText,
          hasCompanyName: hasCompanyName,
          hasSalaryBand: hasSalaryBand
        });
        
        console.log(`JobCard[${i}] 再確認:`);
        console.log(`  タイトル: ${title}`);
        console.log(`  年収帯: ${salaryText}`);
        console.log(`  会社名が表示されている: ${hasCompanyName ? '✅' : '❌'}`);
        console.log(`  年収帯が表示されている: ${hasSalaryBand ? '✅' : '❌'}\n`);
      }
    }
    
    // コンソールログを確認
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Extraction result') || text.includes('再抽出結果をFirestoreに保存') || msg.type() === 'error') {
        consoleMessages.push(`[${msg.type()}]: ${text}`);
      }
    });
    
    // 5秒待ってから終了
    await page.waitForTimeout(5000);
    
    if (consoleMessages.length > 0) {
      console.log('=== ブラウザコンソールメッセージ ===');
      consoleMessages.forEach(msg => console.log(msg));
      console.log('');
    }
    
    // テスト結果のサマリー
    console.log('=== テスト結果サマリー ===');
    const successCount = testResults.filter(r => r.status === '✅').length;
    const totalCount = testResults.length;
    console.log(`成功: ${successCount}/${totalCount}`);
    console.log(`成功率: ${Math.round((successCount / totalCount) * 100)}%\n`);
    
    // スクリーンショットを保存
    await page.screenshot({ path: 'test-results/screenshot-after-fix.png', fullPage: true });
    console.log('📸 スクリーンショットを保存: test-results/screenshot-after-fix.png');
    
    // テスト結果をJSONで保存
    const fs = require('fs');
    fs.writeFileSync(
      'test-results/fix-verification-results.json',
      JSON.stringify({ testResults, afterResults, summary: { successCount, totalCount } }, null, 2)
    );
    console.log('💾 テスト結果を保存: test-results/fix-verification-results.json');
    
  } catch (error) {
    console.error('❌ エラー:', error);
    await page.screenshot({ path: 'test-results/screenshot-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ テスト完了');
  }
})();
