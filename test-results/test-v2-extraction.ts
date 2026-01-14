import { extractJobData } from '../lib/parsers/jobExtractor';
import * as fs from 'fs';
import * as path from 'path';

// テストデータを読み込む
const testCases = [
  {
    name: 'freee データアナリスト',
    url: 'https://herp.careers/v1/freee/jobs/analytics',
    title: '【エンジニアリング基盤本部】データアナリスト',
    contentPath: path.join(__dirname, '../reference/test.freee.md')
  },
  {
    name: 'デロイト コンサルタント',
    url: 'https://deloitte.com/jobs/consulting',
    title: '合同会社デロイト トーマツ／コンサルティング Energy & Chemicals, Mining & Metals（エネルギー、素材化学、鉄鋼領域）',
    contentPath: path.join(__dirname, '../reference/test.deloitte.md')
  },
  {
    name: 'マネーフォワード プロダクトデザイナー',
    url: 'https://moneyforward.com/careers/product-designer',
    title: '【プロダクトデザイナー（UI/UX）_オープンポジション】_東京（田町）',
    contentPath: path.join(__dirname, '../reference/test.moneyforward.md')
  }
];

const results: any[] = [];

for (const testCase of testCases) {
  const content = fs.readFileSync(testCase.contentPath, 'utf-8');
  const extracted = extractJobData(testCase.url, testCase.title, content);
  
  results.push({
    name: testCase.name,
    ...extracted
  });
  
  console.log(`\n=== ${testCase.name} ===`);
  console.log(`会社名: ${extracted.companyName || '❌ 抽出失敗'}`);
  console.log(`役職名: ${extracted.jobTitle || '❌ 抽出失敗'}`);
  console.log(`年収: ${extracted.salaryMin ? `${extracted.salaryMin / 10000}万円` : ''}${extracted.salaryMax ? `〜${extracted.salaryMax / 10000}万円` : ''} ${extracted.salaryBand || ''}`);
  console.log(`職種タグ: ${extracted.jobType || '❌ 抽出失敗'}`);
  console.log(`業種タグ: ${extracted.industry || '❌ 抽出失敗'}`);
  console.log(`職務内容: ${extracted.jobDescription ? `${extracted.jobDescription.length}文字` : '❌ 抽出失敗'}`);
  console.log(`求める人物像: ${extracted.requiredPerson ? `${extracted.requiredPerson.length}文字` : '❌ 抽出失敗'}`);
}

// 結果をJSONファイルに保存
const jsonPath = path.join(__dirname, 'v2-extraction-results.json');
fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8');
console.log(`\n結果を ${jsonPath} に保存しました`);
