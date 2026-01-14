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

async function saveJob(data, testName) {
  console.log(`\n${testName} を保存中...`);
  
  try {
    const response = await fetch('http://localhost:3001/api/jobs/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${testName} を保存しました (ID: ${result.id})`);
      return result.id;
    } else {
      console.error(`❌ ${testName} の保存に失敗:`, result.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${testName} の保存エラー:`, error.message);
    return null;
  }
}

async function main() {
  console.log('SmartHRとSansanのデータを保存します...\n');
  
  await saveJob(smarthrData, 'SmartHR');
  await saveJob(sansanData, 'Sansan');
  
  console.log('\n✅ データ保存完了。ブラウザで http://localhost:3001 を確認してください。');
}

main().catch(console.error);
