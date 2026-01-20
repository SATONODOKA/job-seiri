/**
 * Gemini API プロバイダー
 * Google Gemini 2.0 Flash Exp を使用して求人情報を抽出
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExtractedJobData, EmploymentType } from '@/types/extractedJobData';

// サーバーサイドでのみ環境変数を読み込む（API Routesでのみ使用）
function getGenAI() {
  if (typeof window !== 'undefined') {
    // クライアントサイドでは使用しない
    return null;
  }
  
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY が設定されていません。LLM機能は無効化されます。');
    return null;
  }
  
  return new GoogleGenerativeAI(API_KEY);
}

const genAI = getGenAI();

/**
 * Gemini APIで求人データを抽出
 */
export async function extractWithGemini(
  url: string,
  title: string,
  content: string,
  htmlStructure: string | null = null,
  metaTags: Array<{ name: string; content: string }> | null = null
): Promise<ExtractedJobData> {
  console.log('[LLM] extractWithGemini 開始');
  console.log('[LLM] API_KEY存在確認:', !!process.env.GEMINI_API_KEY);
  console.log('[LLM] genAI存在確認:', !!genAI);

  if (!genAI) {
    const error = new Error('Gemini APIが初期化されていません。GEMINI_API_KEYを設定してください。');
    console.error('❌', error.message);
    throw error;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = buildPrompt(url, title, content, htmlStructure, metaTags);
  console.log('[LLM] プロンプト長:', prompt.length, '文字');

  const startTime = Date.now();
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const elapsedTime = Date.now() - startTime;

  console.log(`[LLM] Gemini処理時間: ${elapsedTime}ms`);
  console.log('[LLM] レスポンステキスト（最初の500文字）:', text.substring(0, 500));

  // JSONをパース
  const extracted = parseLLMResponse(text);
  console.log('[LLM] LLM抽出結果:', JSON.stringify(extracted, null, 2));

  return extracted;
}

/**
 * プロンプトを構築
 */
function buildPrompt(
  url: string,
  title: string,
  content: string,
  htmlStructure: string | null = null,
  metaTags: Array<{ name: string; content: string }> | null = null
): string {
  // メタタグ情報を文字列化
  const metaTagsText = metaTags && metaTags.length > 0
    ? metaTags.map(m => `- ${m.name}: ${m.content}`).join('\n')
    : 'なし';

  // HTML構造情報を追加（存在する場合）
  const htmlStructureText = htmlStructure
    ? `\n\n【HTML構造（参考）】\n${htmlStructure.substring(0, 30000)}${htmlStructure.length > 30000 ? '...' : ''}`
    : '';

  return `あなたは日本の求人情報の構造化データ抽出の専門家です。
以下の情報から求人情報を抽出し、構造化データとして返してください。

【入力データ】
URL: ${url}
ページタイトル: ${title}

【メタデータ】
${metaTagsText}

【元のテキスト内容】
${content.substring(0, 20000)}${content.length > 20000 ? '...' : ''}${htmlStructureText}

---

【抽出の原理原則】

1. **情報の重要度に基づく優先順位付け**
   - UIで必須表示される項目（companyName, jobTitle, salary）を最優先で抽出
   - 補助情報は可能な限り抽出するが、不確実な場合はnullを返す

2. **多様な情報源からの統合**
   - URL、タイトル、テキスト、HTML構造、メタデータを総合的に活用
   - 複数の情報源から矛盾なく情報を統合し、最も信頼性の高い情報源を優先

3. **構造的理解と文脈把握**
   - まず全体構造を理解し、次に各セクションを分析
   - 見出し、セクション、リストなどの構造を認識し、情報の配置パターンを把握

4. **推測と検証のバランス**
   - 明確に記載されている情報を優先
   - 推測可能な情報（URLから会社名など）は積極的に活用
   - 不確実な情報はnullを返す

---

【抽出の思考プロセス】

1. **全体構造の理解**
   - テキスト、HTML構造、メタデータを総合的に分析
   - 見出し、セクション、リストなどの構造を認識
   - 情報の配置パターンを把握

2. **情報源の優先順位付け**
   - 最も信頼性の高い情報源を特定（URL、タイトル、メタデータ、本文）
   - 複数の情報源から矛盾なく情報を統合

3. **各フィールドの抽出**
   - 最重要フィールド（companyName, jobTitle, salary）から順に抽出
   - 構造的理解に基づいて適切なセクションを特定
   - 推測可能な情報は積極的に活用

4. **品質チェック**
   - 抽出した情報の一貫性を確認
   - 不確実な情報はnullを返す

---

【各フィールドの抽出方針】

**最重要フィールド（UIで必須表示）**

- **companyName（会社名）**: URL、タイトル、テキスト、メタデータから統合的に抽出。法人格を含める。
- **jobTitle（職種名）**: タイトル、見出し、セクション構造から抽出。会社名や部署名と区別する。
- **salaryMin, salaryMax（年収）**: 様々な表記形式（万円、月給、時給など）に対応し、円単位に統一。
- **salaryBand（年収帯）**: salaryMaxに基づいて自動計算（〜500, 500-700, 700-900, 900+）。

**重要フィールド（UIで表示・フィルター対象）**

- **jobType（職種カテゴリ）**: jobTitleやjobDescriptionから推測。自然な日本語で返す。
- **industry（業種）**: テキスト内の業種情報から推測。自然な日本語で返す。

**補助フィールド（詳細表示用）**

- **locationText（勤務地）**: 都道府県や市区町村を抽出。
- **remoteType（リモートワーク種別）**: onsite, hybrid, remote, unknownのいずれか。
- **employmentType（雇用形態）**: full_time, contract, temporary, intern, otherのいずれか。
- **requiredYears（必要経験年数）**: 数値のみ抽出。
- **seniorityLevel（シニアリティレベル）**: requiredYearsやjobTitleから推測。
- **jobDescription（仕事内容）**: 500文字程度まで抽出（長すぎる場合は要約）。
- **requiredPerson（求める人物像）**: 500文字程度まで抽出（長すぎる場合は要約）。

---

【重要なルール】

1. **優先度**: companyName, jobTitle, salaryMin/salaryMaxを最優先で抽出
2. **推測の許容**: companyNameとjobTitleはURLやタイトルから積極的に推測
3. **数値の正規化**: 全角数字・半角数字・「万」表記など、様々な形式に対応
4. **nullの使用**: 情報が明確に記載されていない場合はnull（推測できない場合はnull）
5. **年収の単位**: 必ず円単位で返す（万円表記を円に変換）
6. **法人格**: 会社名には必ず法人格を含める
7. **柔軟性**: テキストから読み取れる適切な情報があれば、それを使用してください。例にない職種や業種でも、テキストに記載されていれば抽出してください

【出力形式】
以下のJSON形式で返してください（nullの可能性があるフィールドは null を返す）:
{
  "companyName": string | null,
  "jobTitle": string | null,
  "salaryMin": number | null,
  "salaryMax": number | null,
  "salaryBand": "〜500" | "500-700" | "700-900" | "900+" | null,
  "locationText": string | null,
  "remoteType": "onsite" | "hybrid" | "remote" | "unknown",
  "employmentType": "full_time" | "contract" | "temporary" | "intern" | "other" | null,
  "requiredYears": number | null,
  "seniorityLevel": "junior" | "mid" | "senior" | "manager" | null,
  "jobDescription": string | null,
  "requiredPerson": string | null,
  "jobType": string | null,
  "industry": string | null
}

JSONのみを返してください（説明文やコメントは不要）。`;
}

/**
 * LLMのレスポンスをパースしてExtractedJobDataに変換
 */
function parseLLMResponse(text: string): ExtractedJobData {
  // JSONブロックを抽出（```json ... ``` の形式に対応）
  let jsonText = text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    console.error('❌ LLMレスポンスのパースエラー:', error);
    console.error('レスポンステキスト:', text);
    throw new Error(`LLMレスポンスのパースに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }

  // salaryBandを自動計算（salaryMaxが存在する場合）
  let salaryBand: ExtractedJobData['salaryBand'] = parsed.salaryBand;
  if (!salaryBand && parsed.salaryMax !== null && parsed.salaryMax !== undefined) {
    const maxInMillion = parsed.salaryMax / 1000000;
    if (maxInMillion < 500) {
      salaryBand = '〜500';
    } else if (maxInMillion < 700) {
      salaryBand = '500-700';
    } else if (maxInMillion < 900) {
      salaryBand = '700-900';
    } else {
      salaryBand = '900+';
    }
  }

  // 型チェックとデータ構築
  const extracted: ExtractedJobData = {
    companyName: parsed.companyName !== undefined ? parsed.companyName : null,
    jobTitle: parsed.jobTitle !== undefined ? parsed.jobTitle : null,
    salaryMin: parsed.salaryMin !== undefined ? parsed.salaryMin : null,
    salaryMax: parsed.salaryMax !== undefined ? parsed.salaryMax : null,
    salaryBand: salaryBand,
    locationText: parsed.locationText !== undefined ? parsed.locationText : null,
    remoteType: parsed.remoteType !== undefined ? parsed.remoteType : 'unknown',
    employmentType: parsed.employmentType !== undefined ? (parsed.employmentType as EmploymentType) : null,
    requiredYears: parsed.requiredYears !== undefined ? parsed.requiredYears : null,
    seniorityLevel: parsed.seniorityLevel !== undefined ? parsed.seniorityLevel : null,
    jobDescription: parsed.jobDescription !== undefined ? parsed.jobDescription : null,
    requiredPerson: parsed.requiredPerson !== undefined ? parsed.requiredPerson : null,
    jobType: parsed.jobType !== undefined ? parsed.jobType : null,
    industry: parsed.industry !== undefined ? parsed.industry : null,
  };
  
  return extracted;
}
