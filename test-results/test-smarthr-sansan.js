const fs = require('fs');

// テストケース1: SmartHR
const smarthrContent = fs.readFileSync('./reference/test-smarthr.md', 'utf-8');
const smarthrData = {
  url: 'https://smarthr.jp/recruit/jobs/ops-bizops',
  title: 'Ops企画／BizOps（ビジネス企画統括本部）',
  content: smarthrContent
};

// テストケース2: Sansan
const sansanContent = fs.readFileSync('./reference/test-sansan.md', 'utf-8');
const sansanData = {
  url: 'https://sansan.com/recruit/jobs/enterprise-sales',
  title: 'エンタープライズセールス［Sansan］',
  content: sansanContent
};

async function testExtraction(data, testName) {
  console.log(`\n=== ${testName} テスト ===`);
  console.log(`URL: ${data.url}`);
  console.log(`Title: ${data.title}`);
  
  try {
    const response = await fetch('http://localhost:3001/api/jobs/extract-on-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('\n抽出結果:');
      console.log(`  会社名: ${result.extracted.companyName || '(抽出失敗)'}`);
      console.log(`  役職名: ${result.extracted.jobTitle || '(抽出失敗)'}`);
      console.log(`  年収帯: ${result.extracted.salaryBand || '(抽出失敗)'}`);
      console.log(`  年収Min: ${result.extracted.salaryMin ? (result.extracted.salaryMin / 10000) + '万円' : '(抽出失敗)'}`);
      console.log(`  年収Max: ${result.extracted.salaryMax ? (result.extracted.salaryMax / 10000) + '万円' : '(抽出失敗)'}`);
      return result.extracted;
    } else {
      console.error('抽出失敗:', result.error);
      return null;
    }
  } catch (error) {
    console.error('エラー:', error.message);
    return null;
  }
}

async function main() {
  console.log('SmartHRとSansanの抽出テストを開始します...\n');
  
  const smarthrResult = await testExtraction(smarthrData, 'SmartHR');
  const sansanResult = await testExtraction(sansanData, 'Sansan');
  
  console.log('\n=== テスト結果サマリー ===');
  console.log('\nSmartHR:');
  console.log(`  会社名: ${smarthrResult?.companyName || '抽出失敗'}`);
  console.log(`  役職名: ${smarthrResult?.jobTitle || '抽出失敗'}`);
  console.log(`  年収帯: ${smarthrResult?.salaryBand || '抽出失敗'}`);
  
  console.log('\nSansan:');
  console.log(`  会社名: ${sansanResult?.companyName || '抽出失敗'}`);
  console.log(`  役職名: ${sansanResult?.jobTitle || '抽出失敗'}`);
  console.log(`  年収帯: ${sansanResult?.salaryBand || '抽出失敗'}`);
}

main().catch(console.error);
