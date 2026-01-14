const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testResults = {
    login: { success: false, error: null },
    jobListDisplay: { success: false, error: null, count: 0 },
    companyNameDisplay: { success: false, error: null, details: [] },
    salaryBandDisplay: { success: false, error: null, details: [] },
    urlValidation: { success: false, error: null, details: [] },
    linkClick: { success: false, error: null, details: [] },
    overall: { success: false, score: 0, total: 6 }
  };
  
  try {
    console.log('🚀 全体の体験テスト開始...\n');
    
    // ステップ1: ログイン
    console.log('📋 ステップ1: ログイン');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (emailInput && passwordInput && submitButton) {
      await emailInput.fill('nodoka.sato.bliss@gmail.com');
      await passwordInput.fill('Sandwichman0418');
      await submitButton.click();
      await page.waitForTimeout(5000);
      
      // ログイン成功の確認（JobCardが表示される）
      try {
        await page.waitForSelector('.bg-white.rounded-xl.border', { timeout: 10000 });
        testResults.login.success = true;
        console.log('✅ ログイン成功\n');
      } catch (error) {
        testResults.login.error = 'JobCardが表示されませんでした';
        console.log('❌ ログイン失敗:', testResults.login.error, '\n');
      }
    } else {
      testResults.login.error = 'ログインフォームが見つかりませんでした';
      console.log('❌ ログイン失敗:', testResults.login.error, '\n');
    }
    
    if (!testResults.login.success) {
      throw new Error('ログインに失敗しました');
    }
    
    // ステップ2: 求人リストの表示確認
    console.log('📋 ステップ2: 求人リストの表示確認');
    const jobCards = await page.$$('.bg-white.rounded-xl.border');
    testResults.jobListDisplay.count = jobCards.length;
    
    if (jobCards.length > 0) {
      testResults.jobListDisplay.success = true;
      console.log(`✅ 求人リスト表示成功: ${jobCards.length}件\n`);
    } else {
      testResults.jobListDisplay.error = '求人カードが表示されていません';
      console.log('❌ 求人リスト表示失敗:', testResults.jobListDisplay.error, '\n');
    }
    
    // ステップ3: 会社名の表示確認
    console.log('📋 ステップ3: 会社名の表示確認');
    const companyNameResults = [];
    for (let i = 0; i < Math.min(10, jobCards.length); i++) {
      const card = jobCards[i];
      const h3 = await card.$('h3');
      if (h3) {
        const title = await h3.textContent();
        const hasCompanyName = title.includes('：') && title.split('：')[0].length > 0;
        companyNameResults.push({
          index: i,
          title: title,
          hasCompanyName: hasCompanyName
        });
      }
    }
    
    const companyNameSuccessCount = companyNameResults.filter(r => r.hasCompanyName).length;
    testResults.companyNameDisplay.success = companyNameSuccessCount >= companyNameResults.length * 0.8; // 80%以上
    testResults.companyNameDisplay.details = companyNameResults;
    
    if (testResults.companyNameDisplay.success) {
      console.log(`✅ 会社名表示成功: ${companyNameSuccessCount}/${companyNameResults.length}件\n`);
    } else {
      console.log(`⚠️ 会社名表示: ${companyNameSuccessCount}/${companyNameResults.length}件（80%未満）\n`);
    }
    
    // ステップ4: 年収帯の表示確認
    console.log('📋 ステップ4: 年収帯の表示確認');
    const salaryBandResults = [];
    for (let i = 0; i < Math.min(10, jobCards.length); i++) {
      const card = jobCards[i];
      const salarySpans = await card.$$('span.bg-blue-100');
      const salaryText = salarySpans.length > 0 ? await salarySpans[0].textContent() : 'なし';
      const hasSalaryBand = salaryText !== 'なし';
      salaryBandResults.push({
        index: i,
        salaryBand: salaryText,
        hasSalaryBand: hasSalaryBand
      });
    }
    
    const salaryBandSuccessCount = salaryBandResults.filter(r => r.hasSalaryBand).length;
    testResults.salaryBandDisplay.success = salaryBandSuccessCount >= salaryBandResults.length * 0.7; // 70%以上
    testResults.salaryBandDisplay.details = salaryBandResults;
    
    if (testResults.salaryBandDisplay.success) {
      console.log(`✅ 年収帯表示成功: ${salaryBandSuccessCount}/${salaryBandResults.length}件\n`);
    } else {
      console.log(`⚠️ 年収帯表示: ${salaryBandSuccessCount}/${salaryBandResults.length}件（70%未満）\n`);
    }
    
    // ステップ5: URLのバリデーション確認
    console.log('📋 ステップ5: URLのバリデーション確認');
    const urlResults = [];
    for (let i = 0; i < Math.min(5, jobCards.length); i++) {
      const card = jobCards[i];
      // カードを展開
      await card.click();
      await page.waitForTimeout(500);
      
      const link = await card.$('a[href^="http"]');
      if (link) {
        const href = await link.getAttribute('href');
        const isValidUrl = href && href.startsWith('http') && !href.includes('undefined') && !href.includes('null');
        urlResults.push({
          index: i,
          url: href,
          isValid: isValidUrl
        });
      } else {
        // 無効なURLの場合、disabledボタンが表示される
        const disabledButton = await card.$('button[disabled]');
        urlResults.push({
          index: i,
          url: 'なし',
          isValid: false,
          hasDisabledButton: !!disabledButton
        });
      }
      
      // カードを閉じる
      await card.click();
      await page.waitForTimeout(300);
    }
    
    const validUrlCount = urlResults.filter(r => r.isValid).length;
    testResults.urlValidation.success = validUrlCount === urlResults.length;
    testResults.urlValidation.details = urlResults;
    
    if (testResults.urlValidation.success) {
      console.log(`✅ URLバリデーション成功: ${validUrlCount}/${urlResults.length}件\n`);
    } else {
      console.log(`⚠️ URLバリデーション: ${validUrlCount}/${urlResults.length}件が有効\n`);
    }
    
    // ステップ6: リンククリックテスト（最初の有効なURLのみ）
    console.log('📋 ステップ6: リンククリックテスト');
    const firstValidUrl = urlResults.find(r => r.isValid);
    if (firstValidUrl) {
      const firstCard = jobCards[firstValidUrl.index];
      await firstCard.click();
      await page.waitForTimeout(500);
      
      const link = await firstCard.$('a[href^="http"]');
      if (link) {
        // 新しいタブで開くリンクをクリック
        const [newPage] = await Promise.all([
          context.waitForEvent('page'),
          link.click()
        ]);
        
        await newPage.waitForTimeout(3000);
        const newPageUrl = newPage.url();
        const isOpened = newPageUrl && newPageUrl.startsWith('http');
        
        testResults.linkClick.success = isOpened;
        testResults.linkClick.details = [{
          expectedUrl: firstValidUrl.url,
          actualUrl: newPageUrl,
          opened: isOpened
        }];
        
        // 新しいタブを閉じる
        await newPage.close();
        
        if (testResults.linkClick.success) {
          console.log(`✅ リンククリック成功: ${newPageUrl}\n`);
        } else {
          console.log(`❌ リンククリック失敗: 期待URL=${firstValidUrl.url}, 実際URL=${newPageUrl}\n`);
        }
      }
    } else {
      testResults.linkClick.error = '有効なURLが見つかりませんでした';
      console.log('⚠️ リンククリックテスト: 有効なURLが見つかりませんでした\n');
    }
    
    // 再抽出の完了を待つ（15秒）
    console.log('⏳ 再抽出の完了を待機中（15秒）...\n');
    await page.waitForTimeout(15000);
    
    // 最終確認: freeeの会社名が表示されているか
    console.log('📋 最終確認: freeeの会社名表示');
    const finalJobCards = await page.$$('.bg-white.rounded-xl.border');
    let freeeFound = false;
    for (let i = 0; i < Math.min(20, finalJobCards.length); i++) {
      const card = finalJobCards[i];
      const h3 = await card.$('h3');
      if (h3) {
        const title = await h3.textContent();
        if (title.includes('フリー') || title.includes('freee')) {
          freeeFound = true;
          console.log(`✅ freeeの求人を発見: ${title}`);
          const hasCompanyName = title.includes('：') && title.split('：')[0].includes('フリー');
          if (hasCompanyName) {
            console.log('✅ freeeの会社名が正しく表示されています\n');
          } else {
            console.log('⚠️ freeeの会社名が表示されていません\n');
          }
          break;
        }
      }
    }
    
    if (!freeeFound) {
      console.log('⚠️ freeeの求人が見つかりませんでした\n');
    }
    
    // テスト結果のサマリー
    const successCount = [
      testResults.login.success,
      testResults.jobListDisplay.success,
      testResults.companyNameDisplay.success,
      testResults.salaryBandDisplay.success,
      testResults.urlValidation.success,
      testResults.linkClick.success
    ].filter(Boolean).length;
    
    testResults.overall.score = successCount;
    testResults.overall.total = 6;
    testResults.overall.success = successCount >= 5; // 5/6以上で成功
    
    console.log('=== テスト結果サマリー ===');
    console.log(`ログイン: ${testResults.login.success ? '✅' : '❌'}`);
    console.log(`求人リスト表示: ${testResults.jobListDisplay.success ? '✅' : '❌'} (${testResults.jobListDisplay.count}件)`);
    console.log(`会社名表示: ${testResults.companyNameDisplay.success ? '✅' : '⚠️'}`);
    console.log(`年収帯表示: ${testResults.salaryBandDisplay.success ? '✅' : '⚠️'}`);
    console.log(`URLバリデーション: ${testResults.urlValidation.success ? '✅' : '⚠️'}`);
    console.log(`リンククリック: ${testResults.linkClick.success ? '✅' : '⚠️'}`);
    console.log(`\n総合評価: ${successCount}/6 (${testResults.overall.success ? '✅ 成功' : '⚠️ 要改善'})\n`);
    
    // スクリーンショットを保存
    await page.screenshot({ path: 'test-results/screenshot-full-e2e.png', fullPage: true });
    console.log('📸 スクリーンショットを保存: test-results/screenshot-full-e2e.png');
    
    // テスト結果をJSONで保存
    const fs = require('fs');
    fs.writeFileSync(
      'test-results/full-e2e-results.json',
      JSON.stringify(testResults, null, 2)
    );
    console.log('💾 テスト結果を保存: test-results/full-e2e-results.json');
    
  } catch (error) {
    console.error('❌ エラー:', error);
    await page.screenshot({ path: 'test-results/screenshot-e2e-error.png', fullPage: true });
    testResults.overall.error = error.message;
  } finally {
    await browser.close();
    console.log('\n✅ テスト完了');
  }
})();
