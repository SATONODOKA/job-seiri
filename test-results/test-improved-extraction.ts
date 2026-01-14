/**
 * 改善後の抽出ロジックテスト
 */

import { extractJobData } from '../lib/parsers/jobExtractor';
import * as fs from 'fs';

const testCases = [
  {
    name: "freee データアナリスト",
    url: "https://herp.careers/v1/freee/jobs/analytics",
    title: "【エンジニアリング基盤本部】データアナリスト",
    content: fs.readFileSync('reference/test.freee.md', 'utf-8')
  },
  {
    name: "デロイト コンサルタント",
    url: "https://deloitte.com/jobs/consulting",
    title: "合同会社デロイト トーマツ／コンサルティング Energy & Chemicals, Mining & Metals（エネルギー、素材化学、鉄鋼領域）",
    content: fs.readFileSync('reference/test.deloitte.md', 'utf-8')
  },
  {
    name: "マネーフォワード プロダクトデザイナー",
    url: "https://moneyforward.com/careers/product-designer",
    title: "【プロダクトデザイナー（UI/UX）_オープンポジション】_東京（田町）",
    content: fs.readFileSync('reference/test.moneyforward.md', 'utf-8')
  }
];

console.log("🧪 改善後の抽出ロジックテスト\n");
console.log("=".repeat(80));

const results: any[] = [];

testCases.forEach((testCase, index) => {
  console.log(`\n📋 テストケース ${index + 1}: ${testCase.name}`);
  console.log("-".repeat(80));
  
  const result = extractJobData(testCase.url, testCase.title, testCase.content);
  results.push({ name: testCase.name, ...result });
  
  console.log("\n📊 抽出結果:");
  console.log(`  会社名: ${result.companyName || "❌ 抽出失敗"}`);
  console.log(`  役職名: ${result.jobTitle || "❌ 抽出失敗"}`);
  console.log(`  年収: ${result.salaryMin ? `${Math.floor(result.salaryMin / 10000)}万円` : "❌"} ${result.salaryMax ? `〜${Math.floor(result.salaryMax / 10000)}万円` : ""}`);
  console.log(`  年収帯: ${result.salaryBand || "❌"}`);
  console.log(`  職種タグ: ${result.jobType || "❌"}`);
  console.log(`  業種タグ: ${result.industry || "❌"}`);
  console.log(`  職務内容: ${result.jobDescription ? `✅ (${result.jobDescription.length}文字)` : "❌"}`);
  console.log(`  求める人物像: ${result.requiredPerson ? `✅ (${result.requiredPerson.length}文字)` : "❌"}`);
  
  if (result.jobDescription) {
    console.log("\n📝 職務内容（最初の150文字）:");
    console.log(`  ${result.jobDescription.substring(0, 150).replace(/\n/g, ' ')}...`);
  }
  
  if (result.requiredPerson) {
    console.log("\n👤 求める人物像（最初の150文字）:");
    console.log(`  ${result.requiredPerson.substring(0, 150).replace(/\n/g, ' ')}...`);
  }
});

console.log("\n\n" + "=".repeat(80));
console.log("✅ テスト完了\n");

// 結果をJSONファイルに保存
fs.writeFileSync(
  'test-results/improved-extraction-results.json',
  JSON.stringify(results, null, 2),
  'utf-8'
);

console.log("📄 結果を test-results/improved-extraction-results.json に保存しました");
