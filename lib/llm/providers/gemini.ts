/**
 * Gemini API プロバイダー
 * Google Gemini 2.5 Flash-Lite を使用（高速・低コスト）
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExtractedJobData } from '@/lib/parsers/jobExtractor';
import { EmploymentType } from '@/lib/parsers/employmentTypeExtractor';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY が設定されていません。LLM機能は無効化されます。');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Gemini APIで求人データを整形・補完
 */
export async function refineWithGemini(
  ruleBasedResult: ExtractedJobData,
  url: string,
  title: string,
  content: string
): Promise<ExtractedJobData> {
  console.log('[LLM] refineWithGemini 開始');
  console.log('[LLM] API_KEY存在確認:', !!process.env.GEMINI_API_KEY);
  console.log('[LLM] genAI存在確認:', !!genAI);
  console.log('[LLM] ルールベース結果:', JSON.stringify(ruleBasedResult, null, 2));

  if (!genAI) {
    console.warn('⚠️ Gemini APIが初期化されていません。ルールベースの結果をそのまま返します。');
    return ruleBasedResult;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = buildPrompt(ruleBasedResult, url, title, content);
    console.log('[LLM] プロンプト長:', prompt.length, '文字');

    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const elapsedTime = Date.now() - startTime;

    console.log(`[LLM] Gemini処理時間: ${elapsedTime}ms`);
    console.log('[LLM] レスポンステキスト（最初の500文字）:', text.substring(0, 500));

    // JSONをパース
    const refined = parseLLMResponse(text, ruleBasedResult);
    console.log('[LLM] LLM整形後結果:', JSON.stringify(refined, null, 2));
    
    // 変更があったかチェック
    const hasChanges = JSON.stringify(ruleBasedResult) !== JSON.stringify(refined);
    console.log('[LLM] ルールベース結果と比較:', hasChanges ? '変更あり' : '変更なし');

    return refined;
  } catch (error) {
    console.error('❌ Gemini API エラー:', error);
    console.error('❌ エラー詳細:', error instanceof Error ? error.stack : String(error));
    // エラー時はルールベースの結果を返す
    return ruleBasedResult;
  }
}

/**
 * プロンプトを構築
 */
function buildPrompt(
  ruleBasedResult: ExtractedJobData,
  url: string,
  title: string,
  content: string
): string {
  return `あなたは求人情報の構造化データ抽出の専門家です。
ルールベースで抽出した結果を検証・修正・補完してください。

【入力データ】
URL: ${url}
タイトル: ${title}

【ルールベース抽出結果】
${JSON.stringify(ruleBasedResult, null, 2)}

【元のテキスト内容（参考用）】
${content.substring(0, 5000)}${content.length > 5000 ? '...' : ''}

【重要なルール】
1. 情報が明確に記載されていない場合は null を返す（推測しない）
2. 年収は円単位で返す（500万円 → 5000000）
3. 会社名は法人格（株式会社など）を含める
4. ルールベースの結果が正しそうな場合はそのまま維持
5. ルールベースでnullの項目のみ、テキストから補完を試みる

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

JSONのみを返してください（説明文は不要）。`;
}

/**
 * LLMのレスポンスをパースしてExtractedJobDataに変換
 */
function parseLLMResponse(text: string, fallback: ExtractedJobData): ExtractedJobData {
  try {
    // JSONブロックを抽出（```json ... ``` の形式に対応）
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    // 型チェックとマージ（LLMの結果で上書き、undefinedの場合はfallbackを維持）
    // nullは有効な値として扱う（LLMが明示的にnullを返した場合はnullを使用）
    const refined: ExtractedJobData = {
      companyName: parsed.companyName !== undefined ? parsed.companyName : fallback.companyName,
      jobTitle: parsed.jobTitle !== undefined ? parsed.jobTitle : fallback.jobTitle,
      salaryMin: parsed.salaryMin !== undefined ? parsed.salaryMin : fallback.salaryMin,
      salaryMax: parsed.salaryMax !== undefined ? parsed.salaryMax : fallback.salaryMax,
      salaryBand: parsed.salaryBand !== undefined ? parsed.salaryBand : fallback.salaryBand,
      locationText: parsed.locationText !== undefined ? parsed.locationText : fallback.locationText,
      remoteType: parsed.remoteType !== undefined ? parsed.remoteType : fallback.remoteType,
      employmentType: parsed.employmentType !== undefined ? (parsed.employmentType as EmploymentType) : fallback.employmentType,
      requiredYears: parsed.requiredYears !== undefined ? parsed.requiredYears : fallback.requiredYears,
      seniorityLevel: parsed.seniorityLevel !== undefined ? parsed.seniorityLevel : fallback.seniorityLevel,
      jobDescription: parsed.jobDescription !== undefined ? parsed.jobDescription : fallback.jobDescription,
      requiredPerson: parsed.requiredPerson !== undefined ? parsed.requiredPerson : fallback.requiredPerson,
      jobType: parsed.jobType !== undefined ? parsed.jobType : fallback.jobType,
      industry: parsed.industry !== undefined ? parsed.industry : fallback.industry,
    };
    
    console.log('[LLM] パース後の比較:');
    console.log('[LLM] companyName:', { LLM: parsed.companyName, fallback: fallback.companyName, result: refined.companyName });
    console.log('[LLM] jobTitle:', { LLM: parsed.jobTitle, fallback: fallback.jobTitle, result: refined.jobTitle });
    console.log('[LLM] salaryMin:', { LLM: parsed.salaryMin, fallback: fallback.salaryMin, result: refined.salaryMin });
    
    return refined;
  } catch (error) {
    console.error('❌ LLMレスポンスのパースエラー:', error);
    console.error('レスポンステキスト:', text);
    // パースエラー時はルールベースの結果を返す
    return fallback;
  }
}
