/**
 * 全テストケース（test-*.md）の抽出ロジックテスト
 */

import { extractJobData } from '../lib/parsers/jobExtractor';
import * as fs from 'fs';
import * as path from 'path';

interface TestCase {
  name: string;
  file: string;
  title: string;
  url: string;
  expected?: {
    companyName?: string;
    jobTitle?: string;
    salaryMin?: number;
    salaryMax?: number;
    salaryBand?: string;
  };
}

const testCases: TestCase[] = [
  {
    name: 'SmartHR',
    file: 'test-smarthr.md',
    title: 'Ops企画／BizOps（ビジネス企画統括本部）',
    url: 'https://smarthr.jp/recruit/jobs/ops-bizops',
    expected: {
      companyName: 'SmartHR株式会社',
      jobTitle: 'Ops企画／BizOps',
      salaryMin: 5880000,
      salaryMax: 10500000,
      salaryBand: '900+',
    },
  },
  {
    name: 'Sansan',
    file: 'test-sansan.md',
    title: 'エンタープライズセールス［Sansan］',
    url: 'https://sansan.com/recruit/jobs/enterprise-sales',
    expected: {
      companyName: 'Sansan株式会社',
      jobTitle: 'エンタープライズセールス',
      salaryMin: 8010000,
      salaryMax: 15060000,
      salaryBand: '900+',
    },
  },
  {
    name: 'トヨタ',
    file: 'test-toyota.md',
    title: 'クルマを形づくるボデー部品のグローバル調達',
    url: 'https://toyota.co.jp/recruit/jobs/procurement',
    expected: {
      companyName: 'トヨタ自動車株式会社',
      jobTitle: 'クルマを形づくるボデー部品のグローバル調達',
      salaryMin: 5000000,
      salaryMax: 16800000,
      salaryBand: '900+',
    },
  },
  {
    name: '楽天',
    file: 'test-rakuten.md',
    title: '楽天グループ全体の顧客戦略に伴う様々なサービスやプロダクトの利用体験を、共に創り上げ向上していただくデザインチームを率いるマネージャーの募集です。',
    url: 'https://rakuten.careers/jobs/design-manager',
    expected: {
      companyName: '楽天グループ株式会社',
      jobTitle: 'デザインチームを率いるマネージャー',
    },
  },
  {
    name: 'ソフトバンク',
    file: 'test-softbank.md',
    title: '【ミッション】ヘルスケアアプリ「HELPO」や健康データ管理サービス「Well-Gate」など、ヘルスケアテクノロジーズ株式会社が展開する自社プロダクトを軸に、法人・自治体向けの事業推進をお任せします。',
    url: 'https://healthcaretech.jp/recruit/jobs/business-development',
    expected: {
      companyName: 'ヘルスケアテクノロジーズ株式会社',
      jobTitle: '事業推進',
      salaryMin: 381025 * 14, // 月給 × 14
      salaryMax: 664000 * 14,
      salaryBand: '500-700',
    },
  },
  {
    name: 'セブンイレブン',
    file: 'test-inote.md',
    title: '【長野・山梨】オペレーション・フィールド・カウンセラー OFC候補',
    url: 'https://www.sej.co.jp/recruit/jobs/ofc',
    expected: {
      companyName: '株式会社セブン‐イレブン・ジャパン',
      jobTitle: 'オペレーション・フィールド・カウンセラー OFC候補',
      salaryMin: 5050000,
      salaryMax: 6000000,
      salaryBand: '500-700',
    },
  },
  {
    name: '五洋建設',
    file: 'test-goyokensetsu.md',
    title: '合職：建築・電気設備設計/機械設備設計',
    url: 'https://hrmos.co/pages/penta-ocean/jobs/design',
    expected: {
      companyName: '五洋建設株式会社',
      jobTitle: '建築・電気設備設計/機械設備設計',
      salaryMin: 6640000,
      salaryMax: 11420000,
      salaryBand: '900+',
    },
  },
  {
    name: 'NTTデータ',
    file: 'test-nttdata.md',
    title: '【TC＆S】業界横断_先進テクノロジーを活用するエンジニア《集約ポスト》<3041>',
    url: 'https://nttdata-career.jposting.net/jobs/engineer',
    expected: {
      companyName: '株式会社エヌ・ティ・ティ・データ',
      jobTitle: '業界横断_先進テクノロジーを活用するエンジニア',
    },
  },
];

function loadTestFile(filename: string): string {
  const filePath = path.join(__dirname, filename);
  return fs.readFileSync(filePath, 'utf-8');
}

function runTests() {
  console.log('🧪 全テストケースの抽出ロジックテスト開始\n');
  
  const results: Array<{
    name: string;
    passed: boolean;
    details: any;
  }> = [];

  for (const testCase of testCases) {
    try {
      const content = loadTestFile(testCase.file);
      const extracted = extractJobData(testCase.url, testCase.title, content);

      const details: any = {
        extracted: {
          companyName: extracted.companyName,
          jobTitle: extracted.jobTitle,
          salaryMin: extracted.salaryMin,
          salaryMax: extracted.salaryMax,
          salaryBand: extracted.salaryBand,
        },
        expected: testCase.expected,
      };

      // 検証
      let passed = true;
      const issues: string[] = [];

      if (testCase.expected?.companyName) {
        if (extracted.companyName !== testCase.expected.companyName) {
          passed = false;
          issues.push(`会社名: 期待値「${testCase.expected.companyName}」、実際「${extracted.companyName}」`);
        }
      }

      if (testCase.expected?.jobTitle) {
        if (extracted.jobTitle !== testCase.expected.jobTitle) {
          passed = false;
          issues.push(`役職名: 期待値「${testCase.expected.jobTitle}」、実際「${extracted.jobTitle}」`);
        }
      }

      if (testCase.expected?.salaryMin) {
        if (extracted.salaryMin !== testCase.expected.salaryMin) {
          passed = false;
          issues.push(`年収Min: 期待値「${testCase.expected.salaryMin}」、実際「${extracted.salaryMin}」`);
        }
      }

      if (testCase.expected?.salaryMax) {
        if (extracted.salaryMax !== testCase.expected.salaryMax) {
          passed = false;
          issues.push(`年収Max: 期待値「${testCase.expected.salaryMax}」、実際「${extracted.salaryMax}」`);
        }
      }

      if (testCase.expected?.salaryBand) {
        if (extracted.salaryBand !== testCase.expected.salaryBand) {
          passed = false;
          issues.push(`年収帯: 期待値「${testCase.expected.salaryBand}」、実際「${extracted.salaryBand}」`);
        }
      }

      details.issues = issues;
      details.passed = passed;

      results.push({
        name: testCase.name,
        passed,
        details,
      });

      const status = passed ? '✅' : '❌';
      console.log(`${status} ${testCase.name}`);
      if (!passed) {
        console.log(`   問題: ${issues.join(', ')}`);
      }
    } catch (error) {
      console.error(`❌ ${testCase.name}: エラー`, error);
      results.push({
        name: testCase.name,
        passed: false,
        details: { error: String(error) },
      });
    }
  }

  console.log('\n📊 テスト結果サマリー');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`成功: ${passedCount}/${totalCount} (${Math.round((passedCount / totalCount) * 100)}%)`);

  // 詳細結果をJSONファイルに保存
  const outputPath = path.join(__dirname, 'all-extraction-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n詳細結果を保存: ${outputPath}`);

  return results;
}

// 実行
if (require.main === module) {
  runTests();
}

export { runTests, testCases };
