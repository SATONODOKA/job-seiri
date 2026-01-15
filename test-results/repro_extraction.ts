
import { extractJobData } from '../lib/parsers/jobExtractor';
import * as fs from 'fs';
import * as path from 'path';

// Fix paths to point to test-results directory
const TEST_DIR = 'test-results';

const testCases = [
    {
        name: "freee データアナリスト",
        url: "https://herp.careers/v1/freee/jobs/analytics",
        title: "【エンジニアリング基盤本部】データアナリスト",
        contentPath: 'test.freee.md'
    },
    {
        name: "デロイト コンサルタント",
        url: "https://deloitte.com/jobs/consulting",
        title: "合同会社デロイト トーマツ／コンサルティング Energy & Chemicals, Mining & Metals（エネルギー、素材化学、鉄鋼領域）",
        contentPath: 'test.deloitte.md'
    },
    {
        name: "マネーフォワード プロダクトデザイナー",
        url: "https://moneyforward.com/careers/product-designer",
        title: "【プロダクトデザイナー（UI/UX）_オープンポジション】_東京（田町）",
        contentPath: 'test.moneyforward.md'
    }
];

console.log("🧪 Current Extraction Logic Verification\n");
console.log("=".repeat(80));

testCases.forEach((testCase, index) => {
    console.log(`\n📋 TestCase ${index + 1}: ${testCase.name}`);
    console.log("-".repeat(80));

    try {
        const content = fs.readFileSync(path.join(TEST_DIR, testCase.contentPath), 'utf-8');
        const result = extractJobData(testCase.url, testCase.title, content);

        console.log("\n📊 Extraction Result:");
        console.log(`  Company: ${result.companyName || "❌ Failed"}`);
        console.log(`  JobTitle: ${result.jobTitle || "❌ Failed"}`);
        console.log(`  Salary: ${result.salaryMin ? `${Math.floor(result.salaryMin / 10000)}万円` : "❌"}`);

    } catch (e) {
        console.error(`Error reading file or extracting: ${e}`);
    }
});
