
import { extractLocation } from '../lib/parsers/locationExtractor';
import { extractEmploymentType } from '../lib/parsers/employmentTypeExtractor';
import { extractExperience } from '../lib/parsers/experienceExtractor';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DIR = 'test-results';

const testCases = [
    {
        name: "freee",
        title: "【エンジニアリング基盤本部】データアナリスト",
        contentPath: 'test.freee.md'
    },
    {
        name: "Deloitte",
        title: "合同会社デロイト トーマツ／コンサルティング Energy & Chemicals, Mining & Metals（エネルギー、素材化学、鉄鋼領域）",
        contentPath: 'test.deloitte.md'
    },
    {
        name: "MoneyForward",
        title: "【プロダクトデザイナー（UI/UX）_オープンポジション】_東京（田町）",
        contentPath: 'test.moneyforward.md'
    }
];

console.log("🧪 Testing New Extractors");

testCases.forEach(tc => {
    try {
        const content = fs.readFileSync(path.join(TEST_DIR, tc.contentPath), 'utf-8');
        console.log(`\n--- ${tc.name} ---`);

        const loc = extractLocation(content);
        console.log("Location:", loc);

        const emp = extractEmploymentType(content);
        console.log("Employment:", emp);

        const exp = extractExperience(content, tc.title);
        console.log("Experience:", exp);
    } catch (e) {
        console.log(`Skipping ${tc.name}: ${e}`);
    }
});
