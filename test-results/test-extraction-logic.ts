/**
 * 抽出ロジックのテストスクリプト
 * 既存のテストケースで抽出ロジックを検証
 */

const { extractJobData } = require('../lib/parsers/jobExtractor');
const fs = require('fs');
const path = require('path');

interface TestCase {
  name: string;
  url: string;
  title: string;
  contentFile: string;
}

const testCases: TestCase[] = [
  {
    name: 'Rakuten',
    url: 'https://japan-job-jp.rakuten.careers/job/東京都/プラットフォーム戦略統括部-顧客戦略部-コーポレート-uxデザイナー-csd/41927/36406562128',
    title: 'プラットフォーム戦略統括部　顧客戦略部　コーポレート：UXデザイナー（CSD）',
    contentFile: 'test-rakuten.md'
  },
  {
    name: 'Softbank',
    url: 'https://www.softbank.jp/recruit/career/positions/detail/004537/',
    title: '事業企画・営業企画（ヘルスケアテクノロジーズ）',
    contentFile: 'test-softbank.md'
  },
  {
    name: 'NTT Data',
    url: 'https://nttdata-career.jposting.net/u/job.phtml?job_code=1301',
    title: '【TC＆S】業界横断_先進テクノロジーを活用するエンジニア《集約ポスト》<3041>',
    contentFile: 'test-nttdata.md'
  },
  {
    name: 'Toyota',
    url: 'https://toyota-career.snar.jp/jobboard/detail.aspx?id=WYBvVsbMu4cBig0hZTwIGA',
    title: 'トヨタ自動車株式会社 求人',
    contentFile: 'test-toyota.md'
  },
  {
    name: 'i-note',
    url: 'https://www.i-note.jp/sej/recruit/career/ofc6.html',
    title: 'セブン‐イレブン・ジャパン 求人',
    contentFile: 'test-inote.md'
  },
  {
    name: 'Goyokensetsu',
    url: 'https://hrmos.co/pages/penta-ocean/jobs/1960983736363667456',
    title: '五洋建設株式会社 求人',
    contentFile: 'test-goyokensetsu.md'
  }
];

async function runTests() {
  const results: any[] = [];

  for (const testCase of testCases) {
    const contentPath = path.join(__dirname, testCase.contentFile);
    
    if (!fs.existsSync(contentPath)) {
      console.log(`⚠️  ${testCase.name}: ファイルが見つかりません: ${testCase.contentFile}`);
      continue;
    }

    const content = fs.readFileSync(contentPath, 'utf-8');
    
    if (!content || content.trim().length === 0) {
      console.log(`⚠️  ${testCase.name}: ファイルが空です: ${testCase.contentFile}`);
      continue;
    }

    try {
      const extracted = extractJobData(testCase.url, testCase.title, content);
      
      results.push({
        name: testCase.name,
        url: testCase.url,
        extracted: extracted,
        issues: []
      });

      // 結果を表示
      console.log(`\n📋 ${testCase.name}`);
      console.log(`   会社名: ${extracted.companyName || '❌ 抽出失敗'}`);
      console.log(`   役職名: ${extracted.jobTitle || '❌ 抽出失敗'}`);
      console.log(`   年収: ${extracted.salaryMin ? `${(extracted.salaryMin / 10000).toFixed(0)}万円` : '❌'} - ${extracted.salaryMax ? `${(extracted.salaryMax / 10000).toFixed(0)}万円` : '❌'}`);
      console.log(`   年収帯: ${extracted.salaryBand || '❌'}`);
      console.log(`   職種タグ: ${extracted.jobType || '❌'}`);
      console.log(`   業種タグ: ${extracted.industry || '❌'}`);
    } catch (error) {
      console.error(`❌ ${testCase.name}: エラーが発生しました`, error);
      results.push({
        name: testCase.name,
        url: testCase.url,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 結果をJSONファイルに保存
  const outputPath = path.join(__dirname, 'extraction-test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n✅ テスト結果を保存しました: ${outputPath}`);
}

runTests().catch(console.error);
