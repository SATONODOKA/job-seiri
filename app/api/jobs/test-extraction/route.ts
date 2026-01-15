import { NextRequest, NextResponse } from 'next/server';
import { extractJobData } from '@/lib/parsers/jobExtractor';
import * as fs from 'fs';
import * as path from 'path';

const testCases = [
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

export async function GET() {
  const results: any[] = [];
  const testResultsDir = path.join(process.cwd(), 'test-results');

  for (const testCase of testCases) {
    const contentPath = path.join(testResultsDir, testCase.contentFile);
    
    if (!fs.existsSync(contentPath)) {
      results.push({
        name: testCase.name,
        url: testCase.url,
        error: `ファイルが見つかりません: ${testCase.contentFile}`
      });
      continue;
    }

    const content = fs.readFileSync(contentPath, 'utf-8');
    
    if (!content || content.trim().length === 0) {
      results.push({
        name: testCase.name,
        url: testCase.url,
        error: `ファイルが空です: ${testCase.contentFile}`
      });
      continue;
    }

    try {
      const extracted = extractJobData(testCase.url, testCase.title, content);
      
      results.push({
        name: testCase.name,
        url: testCase.url,
        extracted: extracted
      });
    } catch (error) {
      results.push({
        name: testCase.name,
        url: testCase.url,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return NextResponse.json({ results }, { status: 200 });
}
