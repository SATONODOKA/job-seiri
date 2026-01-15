
import { extractJobData } from '../lib/parsers/jobExtractor';
import * as fs from 'fs';
import * as path from 'path';

console.log("Starting script...");
const TEST_DIR = 'test-results';
const files = [
    'test-google.md',
    'test-goyokensetsu.md',
    'test-inote.md',
    'test-nttdata.md',
    'test-rakuten.md',
    'test-sansan.md',
    'test-smarthr.md',
    'test-softbank.md',
    'test-toyota.md',
    'test.deloitte.md',
    'test.freee.md',
    'test.moneyforward.md',
    'test-456194.md'
];

console.log("🧪 Comprehensive Extraction Verification\n");

const header = "| File | Company | Job Title | Salary | Remote | Emp | Exp |";
const divider = "| --- | --- | --- | --- | --- | --- | --- |";
console.log(header);
console.log(divider);

files.forEach(filename => {
    const filePath = path.join(TEST_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`| ${filename} | ❌ File missing | - | - | - | - | - |`);
        return;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Extract first line as title if possible
        const title = content.split('\n')[0].trim() || filename;
        const url = `https://example.com/${filename.replace('.md', '')}`;

        const result = extractJobData(url, title, content);

        const company = result.companyName || "❌";
        const jobTitle = result.jobTitle || "❌";
        const salary = result.salaryMin ? `${Math.floor(result.salaryMin / 10000)}万円〜` : "❌";
        const remote = result.remoteType || "unknown";
        const emp = result.employmentType || "❌";
        const exp = result.requiredYears ? `${result.requiredYears}yr` : "❌";

        console.log(`| ${filename} | ${company} | ${jobTitle} | ${salary} | ${remote} | ${emp} | ${exp} |`);
    } catch (e) {
        console.log(`| ${filename} | ❌ Error | - | - | - | - | - |`);
    }
});
