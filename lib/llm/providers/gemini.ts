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
  content: string
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

  const prompt = buildPrompt(url, title, content);
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
  content: string
): string {
  return `あなたは日本の求人情報の構造化データ抽出の専門家です。
以下の情報から求人情報を抽出し、構造化データとして返してください。

【入力データ】
URL: ${url}
ページタイトル: ${title}

【元のテキスト内容】
${content.substring(0, 12000)}${content.length > 12000 ? '...' : ''}

【抽出の優先度】
以下の順序で優先的に抽出してください：

- UIで必須表示される項目（可能な限り抽出）
- UIで表示・フィルター対象の項目
- 詳細表示用の項目

---

【UIで必須表示される項目】可能な限り抽出してください

1. **companyName（会社名）**
   - **抽出方法**: テキスト内、URL、タイトルから会社名を探す
     - テキスト内で「株式会社」「合同会社」「有限会社」などの法人格を含む会社名
     - URLのドメイン名から推測（例: careers.toyota.co.jp → "トヨタ自動車株式会社"）
     - タイトルに会社名が含まれる場合
     - テキスト内で繰り返し出現する会社名
   - **形式**: 法人格を含める（例: "株式会社○○", "○○株式会社"）
   - **注意**: URLやタイトルから推測できる場合は積極的に使用

2. **jobTitle（職種名）**
   - **抽出方法**: テキストやタイトルから職種名を探す
     - 「募集職種」「職種」「ポジション」「採用職種」などの見出し行の直後
     - タイトルに含まれる職種名
     - 見出し行の次の行（空行をスキップ）
   - **形式**: 具体的な職種名をそのまま抽出
   - **注意**: 会社名や部署名が混在する場合は職種名のみを抽出

3. **salaryMin, salaryMax（年収）**
   - **抽出方法**: 「年収」「給与」「給与・賞与」などのセクションから数値を抽出
   - **変換ルール**: 様々な表記形式に対応
     - "500万円" → 5000000
     - "500万" → 5000000
     - "600万〜800万" → salaryMin: 6000000, salaryMax: 8000000
     - "500万円以上" → salaryMin: 5000000, salaryMax: null
     - "月給30万円" → 3600000（30万円×12ヶ月）
     - "時給2000円" → 年収に変換（2000円×160時間×12ヶ月 = 3840000）
   - **形式**: 円単位の数値（number型）
   - **注意**: 全角・半角数字、様々な表記形式に対応。範囲がある場合は両方を設定、単一の場合はsalaryMinのみ設定

4. **salaryBand（年収帯）**
   - **計算方法**: salaryMaxに基づいて自動計算
     - salaryMax < 5000000 → "〜500"
     - 5000000 <= salaryMax < 7000000 → "500-700"
     - 7000000 <= salaryMax < 9000000 → "700-900"
     - 9000000 <= salaryMax → "900+"
   - **注意**: salaryMaxがnullの場合はnullを返す（後で自動計算される）

---

【重要項目】UIで表示・フィルター対象

5. **jobType（職種カテゴリ）**
   - **抽出方法**: jobTitleやjobDescriptionから職種カテゴリを推測
   - **形式**: テキストから読み取れる職種カテゴリを自然な日本語で返す（例: "エンジニア", "デザイナー", "営業", "マーケティング", "PM", "データサイエンティスト"など）
   - **注意**: 
     - 上記はあくまで例です。テキストに適切な職種カテゴリがあれば、それを使用してください
     - 複数のカテゴリに該当する場合は、最も主要なものを選択
     - 該当するカテゴリが見つからない場合はnull

6. **industry（業種）**
   - **抽出方法**: テキスト内の業種情報から推測
   - **形式**: テキストから読み取れる業種を自然な日本語で返す（例: "IT", "金融", "製造業", "コンサルティング", "広告", "小売"など）
   - **注意**: 
     - 上記はあくまで例です。テキストに適切な業種があれば、それを使用してください
     - 複数の業種に該当する場合は、最も主要なものを選択
     - 該当する業種が見つからない場合はnull

---

【補助項目】詳細表示用

7. **locationText（勤務地）**
   - **抽出方法**: 「勤務地」「就業場所」「勤務場所」などのセクションから抽出
   - **形式**: 都道府県や市区町村（例: "東京都渋谷区", "大阪府大阪市"）
   - **注意**: "リモート可"などの表記はremoteTypeに反映

8. **remoteType（リモートワーク種別）**
   - **判定方法**:
     - "出社必須", "オフィス勤務" → "onsite"
     - "リモート可", "在宅勤務可", "フルリモート" → "remote"
     - "ハイブリッド", "出社とリモート併用" → "hybrid"
     - 記載がない → "unknown"

9. **employmentType（雇用形態）**
   - **判定方法**:
     - "正社員", "正職員" → "full_time"
     - "契約社員", "業務委託" → "contract"
     - "派遣" → "temporary"
     - "インターン", "インターンシップ" → "intern"
     - "アルバイト", "パート" → "other"
     - 記載がない → null

10. **requiredYears（必要経験年数）**
    - **抽出方法**: 「経験年数」「必須経験」などのセクションから数値を抽出
    - **形式**: 数値のみ（例: "3年以上" → 3, "5年" → 5）
    - **注意**: "未経験可"の場合は0ではなくnull

11. **seniorityLevel（シニアリティレベル）**
    - **判定方法**: requiredYearsやjobTitleから推測
      - 1-3年 → "junior"
      - 3-7年 → "mid"
      - 7年以上 → "senior"
      - "マネージャー", "リーダー"などの役職 → "manager"
    - **注意**: 明確でない場合はnull

12. **jobDescription（仕事内容）**
    - **抽出方法**: 「仕事内容」「業務内容」「職務内容」などのセクションから抽出
    - **形式**: 説明文（200文字程度まで、長すぎる場合は要約）

13. **requiredPerson（求める人物像）**
    - **抽出方法**: 「求める人物像」「こんな方を求めています」「必須スキル」などのセクションから抽出
    - **形式**: 説明文（200文字程度まで、長すぎる場合は要約）

---

【重要なルール】

1. **優先度**: companyName, jobTitle, salaryMin/salaryMaxを最優先で抽出
2. **推測の許容**: companyNameとjobTitleはURLやタイトルから積極的に推測
3. **数値の正規化**: 全角数字・半角数字・「万」表記など、様々な形式に対応
4. **nullの使用**: 情報が明確に記載されていない場合はnull（推測できない場合はnull）
5. **年収の単位**: 必ず円単位で返す（万円表記を円に変換）
6. **法人格**: 会社名には必ず法人格を含める
7. **柔軟性**: 上記の説明や例は参考です。テキストから読み取れる適切な情報があれば、それを使用してください。例にない職種や業種でも、テキストに記載されていれば抽出してください

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
