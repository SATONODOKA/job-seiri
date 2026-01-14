import { extractJobData } from '../lib/parsers/jobExtractor';

// URLから会社名を推測するテスト
const testCases = [
  {
    name: 'herp.careers - freee',
    url: 'https://herp.careers/v1/freee/jobs/analytics',
    title: '【エンジニアリング基盤本部】データアナリスト',
    content: 'テスト用のcontent',
    expectedCompanyName: 'フリー株式会社'
  },
  {
    name: 'herp.careers - moneyforward',
    url: 'https://herp.careers/v1/moneyforward/jobs/designer',
    title: 'プロダクトデザイナー',
    content: 'テスト用のcontent',
    expectedCompanyName: '株式会社マネーフォワード'
  },
  {
    name: 'Wantedly - example',
    url: 'https://www.wantedly.com/companies/example/postings/12345',
    title: 'エンジニア募集',
    content: 'テスト用のcontent',
    expectedCompanyName: null // マッピングがない場合はnull
  },
  {
    name: '自社サイト - moneyforward.com',
    url: 'https://moneyforward.com/careers/product-designer',
    title: 'プロダクトデザイナー',
    content: 'テスト用のcontent',
    expectedCompanyName: '株式会社マネーフォワード'
  }
];

console.log('=== URLから会社名を推測するテスト ===\n');

for (const testCase of testCases) {
  const extracted = extractJobData(testCase.url, testCase.title, testCase.content);
  const result = extracted.companyName === testCase.expectedCompanyName ? '✅' : '❌';
  
  console.log(`${result} ${testCase.name}`);
  console.log(`  URL: ${testCase.url}`);
  console.log(`  期待値: ${testCase.expectedCompanyName || 'null'}`);
  console.log(`  実際値: ${extracted.companyName || 'null'}`);
  console.log('');
}
