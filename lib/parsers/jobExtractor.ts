/**
 * 求人情報抽出ロジック（ルールベース）
 * reference/job_seiri_data_design_v1.md を参考に実装
 * 
 * 設計方針:
 * - 設定データとロジックを分離
 * - 関数は単一責任の原則に従い、小さく分割
 * - パターンマッチングを共通化
 * - 優先順位を明確化
 */

import { extractLocation } from './locationExtractor';
import { extractEmploymentType, EmploymentType } from './employmentTypeExtractor';
import { extractExperience, ExperienceData } from './experienceExtractor';

export interface ExtractedJobData {
  companyName: string | null;
  jobTitle: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryBand: "〜500" | "500-700" | "700-900" | "900+" | null;
  locationText: string | null;
  remoteType: "onsite" | "hybrid" | "remote" | "unknown";
  employmentType: EmploymentType;
  requiredYears: number | null;
  seniorityLevel: "junior" | "mid" | "senior" | "manager" | null;
  jobDescription: string | null;
  requiredPerson: string | null;
  jobType: string | null;
  industry: string | null;
}

// ============================================================================
// 設定データ（企業マッピング、パターン定義など）
// ============================================================================

/**
 * 法人格のパターン（汎用的、拡張可能）
 */
const LEGAL_ENTITY_PATTERNS = [
  '株式会社', '合同会社', '有限会社', '合資会社', '合名会社',
  '一般社団法人', '一般財団法人', '公益社団法人', '公益財団法人',
  'NPO法人', '特定非営利活動法人', '社会福祉法人', '医療法人',
  '学校法人', '宗教法人', '協同組合', '相互会社'
] as const;

/**
 * ドメイン→会社名マッピング（既知の企業）
 */
const DOMAIN_TO_COMPANY_MAP: Record<string, string> = {
  'smarthr': 'SmartHR株式会社',
  'rakuten': '楽天グループ株式会社',
  'toyota': 'トヨタ自動車株式会社',
  'softbank': 'ソフトバンクグループ株式会社',
  'nttdata': '株式会社エヌ・ティ・ティ・データ',
  'google': 'Google',
  'sansan': 'Sansan株式会社',
  'freee': 'フリー株式会社',
  'moneyforward': '株式会社マネーフォワード',
  'deloitte': '合同会社デロイト トーマツ',
  'goyokensetsu': '五洋建設株式会社',
  'penta-ocean': '五洋建設株式会社',
};

/**
 * スラッグ→会社名マッピング（特定企業の特殊ケース）
 */
const SLUG_TO_COMPANY_MAP: Record<string, string> = {
  'penta-ocean': '五洋建設株式会社',
  'toyota': 'トヨタ自動車株式会社',
  'nttdata': '株式会社エヌ・ティ・ティ・データ',
};

/**
 * 明確な会社名パターン（正規表現）
 */
const EXPLICIT_COMPANY_NAME_PATTERNS: RegExp[] = [
  /トヨタ自動車株式会社/,
  /株式会社トヨタ自動車/,
  /セブン[‐-]イレブン[・・]ジャパン/,
  /株式会社セブン[‐-]イレブン[・・]ジャパン/,
  /五洋建設株式会社/,
  /株式会社五洋建設/,
  /ヘルスケアテクノロジーズ株式会社/,
  /株式会社ヘルスケアテクノロジーズ/,
  /楽天グループ株式会社/,
  /株式会社楽天/,
];

/**
 * 見出し行のパターン
 */
const HEADING_PATTERNS: RegExp[] = [
  /^職種\s*[\/／]\s*募集ポジション\s*$/,
  /^募集職種\s*[:：\s\t]*$/,
  /^職種\s*[:：\s\t]*$/,
  /^ポジション\s*[:：\s\t]*$/,
  /^主な業務内容\s*$/,
  /^業務内容\s*$/,
  /^職務内容\s*$/,
  /^(職種紹介|福利厚生|入社後の流れ|募集要項|採用情報|事業紹介)\s*$/,
];

/**
 * 除外キーワード（説明文の見出しなど）
 */
const EXCLUDE_KEYWORDS = [
  '代表', '業種', '設立', '従業員', '事業', 'オフィス', '所在地', '資本金', '本社', '支社',
  'とは', 'について', 'の営業', 'の特徴', 'の強み', 'の魅力', 'に関する', 'では',
  '顧客', 'お客様', 'サービス', '提供', '実現', 'リード', '未来', '価値', 'ミッション',
  'する', 'なる', 'ある', 'いる', 'できる', '行う', '行く', '来る', '見る', '聞く',
] as const;

/**
 * 説明文のサフィックスパターン
 */
const DESCRIPTION_SUFFIX_PATTERN = /(の[^、。\n]+とは|とは|について|に関する|では|が|の特徴|の強み|の魅力|の営業)$/;

// ============================================================================
// URLから会社名を抽出
// ============================================================================

/**
 * URLから会社名を推測（汎用版）
 * ATS（herp.careers、Wantedly等）や自社サイト（SmartHR等）に対応
 */
function extractCompanyNameFromURL(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;

    // 1. herp.careers パターン: /v1/{company}/jobs/{job_id}
    const herpMatch = pathname.match(/\/v1\/([^\/]+)\/jobs\//);
    if (herpMatch?.[1]) {
      return guessCompanyNameFromSlug(herpMatch[1]);
    }

    // 2. Wantedly パターン: /companies/{company}/postings/{job_id}
    const wantedlyMatch = pathname.match(/\/companies\/([^\/]+)\/postings\//);
    if (wantedlyMatch?.[1]) {
      return guessCompanyNameFromSlug(wantedlyMatch[1]);
    }

    // 3. .careers ドメインパターン
    if (hostname.includes('.careers')) {
      const domainParts = hostname.split('.');
      if (domainParts.length >= 3) {
        const mainDomainPart = domainParts[domainParts.length - 2];
        const guessed = guessCompanyNameFromDomain(mainDomainPart);
        if (guessed) return guessed;
      }
      if (domainParts.length >= 2) {
        return guessCompanyNameFromDomain(domainParts[0]);
      }
    }

    // 4. hrmos.co パターン
    if (hostname.includes('hrmos.co')) {
      const pathMatch = pathname.match(/\/pages\/([^\/]+)\//);
      if (pathMatch?.[1]) {
        const companySlug = pathMatch[1];
        if (SLUG_TO_COMPANY_MAP[companySlug]) {
          return SLUG_TO_COMPANY_MAP[companySlug];
        }
        return guessCompanyNameFromSlug(companySlug);
      }
    }

    // 5. jposting.net / .snar.jp パターン
    if (hostname.includes('jposting.net') || hostname.includes('.snar.jp')) {
      const domainParts = hostname.split('.');
      if (domainParts.length >= 2) {
        const subdomain = domainParts[0];
        const companySlug = subdomain.replace(/-career$/, '').replace(/-recruit$/, '');
        if (companySlug && companySlug.length > 2) {
          if (SLUG_TO_COMPANY_MAP[companySlug]) {
            return SLUG_TO_COMPANY_MAP[companySlug];
          }
          return guessCompanyNameFromSlug(companySlug);
        }
      }
    }

    // 6. 自社サイトパターン
    const domainParts = hostname.split('.');
    if (domainParts.length >= 2) {
      const mainDomain = domainParts[0];
      const isRecruitPage = /\/(recruit|careers|jobs|採用)/i.test(pathname);
      
      if (isRecruitPage || hostname.match(/\.(com|co\.jp|jp)$/)) {
        return guessCompanyNameFromDomain(mainDomain);
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * スラッグから会社名を推測（汎用版）
 */
function guessCompanyNameFromSlug(slug: string): string | null {
  // 既知のマッピングを優先
  if (SLUG_TO_COMPANY_MAP[slug]) {
    return SLUG_TO_COMPANY_MAP[slug];
  }

  // 汎用的なスラッグ→会社名変換
  let companyName = slug
    .replace(/-/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  if (companyName.length > 0 && companyName.length < 30) {
    return companyName;
  }

  return null;
}

/**
 * ドメイン名から会社名を推測（汎用版）
 */
function guessCompanyNameFromDomain(domain: string): string | null {
  const normalizedDomain = domain.toLowerCase();

  // 既知のマッピングを優先
  if (DOMAIN_TO_COMPANY_MAP[normalizedDomain]) {
    return DOMAIN_TO_COMPANY_MAP[normalizedDomain];
  }

  // 汎用的なドメイン→会社名変換
  let companyName = normalizedDomain
    .replace(/-/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  if (companyName.length >= 3 && companyName.length < 30) {
    return companyName;
  }

  return null;
}

// ============================================================================
// 共通ユーティリティ関数
// ============================================================================

/**
 * 法人格を含むかチェック（汎用的）
 */
function containsLegalEntity(text: string): boolean {
  return LEGAL_ENTITY_PATTERNS.some(pattern => text.includes(pattern));
}

/**
 * テキストが説明文かどうかを判定
 */
function isDescriptionText(text: string): boolean {
  return (
    text.length > 50 ||
    /[をにがでとからよりまで]/g.test(text) ||
    text.includes('展開') || text.includes('提供') ||
    text.includes('実現') || text.includes('推進') ||
    DESCRIPTION_SUFFIX_PATTERN.test(text)
  );
}

/**
 * 見出し行かどうかを判定
 */
function isHeadingLine(line: string): boolean {
  return HEADING_PATTERNS.some(pattern => pattern.test(line.trim()));
}

/**
 * 数値をパース（カンマ、スペース対応）
 */
function parseNumber(str: string): number {
  const cleaned = str.replace(/,/g, '').replace(/\s/g, '').replace(/　/g, '').replace(/\u00A0/g, '');
  const num = parseInt(cleaned, 10);
  if (isNaN(num) || num === 0) {
    throw new Error(`Invalid number: ${str}`);
  }
  return num;
}

/**
 * 年収として妥当な範囲かチェック
 */
function isValidSalaryRange(min: number, max: number | null = null): boolean {
  if (max === null) {
    return min >= 1000000 && min <= 50000000;
  }
  return min >= 1000000 && min <= 50000000 && max >= min && max <= 50000000;
}

/**
 * 年収帯を計算
 */
function calculateSalaryBand(salary: number): "〜500" | "500-700" | "700-900" | "900+" {
  if (salary < 5000000) return "〜500";
  if (salary < 7000000) return "500-700";
  if (salary < 9000000) return "700-900";
  return "900+";
}

// ============================================================================
// 会社名抽出（優先順位に従って分割）
// ============================================================================

/**
 * 「募集元」セクションから会社名を抽出
 */
function extractFromRecruitmentSource(content: string): string | null {
  const pattern = /募集元\s*[:：\s]*\s*(株式会社[^。\n]{1,50})/;
  const match = content.match(pattern);
  if (match?.[1]) {
    const companyName = match[1].trim();
    if (containsLegalEntity(companyName) && companyName.length > 0 && companyName.length < 50) {
      return companyName;
    }
  }
  return null;
}

/**
 * 最初の数行から会社名を抽出
 */
function extractFromFirstLines(content: string): string | null {
  const firstFewLines = content.split('\n').slice(0, 5).join('\n');
  const pattern = /([^。\n]{0,30}株式会社)/;
  const match = firstFewLines.match(pattern);
  if (match?.[1]) {
    const companyName = match[1].trim();
    if (containsLegalEntity(companyName) && 
        companyName.length > 0 && companyName.length < 30 &&
        !isDescriptionText(companyName)) {
      return companyName;
    }
  }
  return null;
}

/**
 * 明確な会社名パターンから抽出
 */
function extractFromExplicitPatterns(content: string): string | null {
  for (const pattern of EXPLICIT_COMPANY_NAME_PATTERNS) {
    const match = content.match(pattern);
    if (match?.[0]) {
      const companyName = match[0].trim();
      // セブンイレブンの正規化
      if (companyName.includes('セブン') && !companyName.includes('株式会社')) {
        const fullPattern = /株式会社セブン[‐-]イレブン[・・]ジャパン/;
        const fullMatch = content.match(fullPattern);
        if (fullMatch?.[0]) {
          return fullMatch[0].trim();
        }
        return '株式会社セブン‐イレブン・ジャパン';
      }
      if (companyName.length > 0 && companyName.length < 50) {
        return companyName;
      }
    }
  }
  return null;
}

/**
 * 汎用的な会社名パターンから抽出（最初の20行）
 */
function extractFromGenericPatterns(content: string): string | null {
  const firstLines = content.split('\n').slice(0, 20).join('\n');
  const patterns = [
    /([^。\n]+グループ株式会社)/,
    /([^。\n]+グループ)(?:\s|$|、|。)/,
    /(株式会社[^。\n]{1,50})/,
    /(五洋建設株式会社)/,
    /(株式会社セブン[‐-]イレブン[・・]ジャパン)/,
    /(セブン[‐-]イレブン[・・]ジャパン)/,
  ];

  for (const pattern of patterns) {
    const match = firstLines.match(pattern);
    if (match?.[1]) {
      const companyName = match[1].trim();
      if (containsLegalEntity(companyName)) {
        if (companyName.length > 0 && companyName.length < 50) {
          return companyName;
        }
      } else if (companyName.endsWith('グループ')) {
        const fullPattern = new RegExp(companyName.replace('グループ', 'グループ株式会社'));
        const fullMatch = content.match(fullPattern);
        if (fullMatch?.[0]) {
          return fullMatch[0].trim();
        }
      } else if (companyName.length > 0 && companyName.length < 50) {
        return companyName;
      }
    }
  }
  return null;
}

/**
 * 「会社名」セクションから抽出
 */
function extractFromCompanyNameSection(content: string): string | null {
  const patterns = [
    /会社名[:：\s\t]+(.+?)(?:\n|$)/m,
    /会社名\s+(.+?)(?:\n|$)/m,
    /企業名[:：\s\t]+(.+?)(?:\n|$)/m,
    /採用企業[:：\s\t]+(.+?)(?:\n|$)/m,
    /会社概要[\s\S]*?会社名[:：\s\t]+(.+?)(?:\n|$)/m,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match?.[1]) {
      const companyName = match[1].trim();
      if (containsLegalEntity(companyName) && companyName.length > 0 && companyName.length < 50) {
        return companyName;
      }
    }
  }
  return null;
}

/**
 * 「会社概要」セクションの直後から抽出
 */
function extractFromCompanyOverview(content: string): string | null {
  const legalEntityRegexStr = LEGAL_ENTITY_PATTERNS.join('|');
  const pattern = new RegExp(`会社概要\\s*\\n\\s*([^\\n]*?(?:${legalEntityRegexStr})[^\\n]*)`);
  const match = content.match(pattern);
  if (match?.[1]) {
    const candidate = match[1].trim().split('\n')[0].trim();
    if (containsLegalEntity(candidate) && candidate.length > 0 && candidate.length < 50) {
      return candidate;
    }
  }
  return null;
}

/**
 * 法人格を含む文字列を直接抽出（複数行対応）
 */
function extractFromLegalEntityPattern(content: string): string | null {
  const legalEntityRegex = LEGAL_ENTITY_PATTERNS.join('|');
  const legalEntityPattern = new RegExp(`(.+?)(?:${legalEntityRegex})`);
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(legalEntityPattern);
    if (match) {
      const fullMatch = line.match(new RegExp(`(.+?)(?:${legalEntityRegex})`));
      if (fullMatch) {
        let companyName = fullMatch[0].trim();
        
        if (isDescriptionText(companyName)) {
          continue;
        }

        // 説明文のサフィックスを除去
        if (DESCRIPTION_SUFFIX_PATTERN.test(line)) {
          companyName = companyName.replace(DESCRIPTION_SUFFIX_PATTERN, '').trim();
          if (companyName.length > 0 && companyName.length < 50) {
            return companyName;
          }
          continue;
        }

        // 次の行をチェック（複合的な会社名）
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.length > 0 && nextLine.length < 30 &&
            !containsLegalEntity(nextLine) &&
            !EXCLUDE_KEYWORDS.some(kw => nextLine.includes(kw)) &&
            !/^\d+[万円億円]*$/.test(nextLine) &&
            !/[るすくい]$/.test(nextLine)) {
            const combined = (companyName + ' ' + nextLine).trim();
            if (combined.length < 50) {
              companyName = combined;
            }
          }
        }

        if (companyName.length > 0 && companyName.length < 50) {
          return companyName;
        }
      }
    }
  }
  return null;
}

/**
 * タイトルから会社名を抽出（フォールバック）
 */
function extractFromTitle(title: string): string | null {
  const patterns = [
    /【(.+?)】/,
    /\[(.+?)\]/,
    /^(.+?)[\s|｜｜]/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].trim();
      if (containsLegalEntity(candidate) && candidate.length > 0 && candidate.length < 50) {
        return candidate;
      }
    }
  }
  return null;
}

/**
 * 会社名を抽出（優先順位に従って実行）
 */
function extractCompanyName(title: string, content: string, url: string): string | null {
  // 優先順位1: 「募集元」セクション
  const fromRecruitment = extractFromRecruitmentSource(content);
  if (fromRecruitment) return fromRecruitment;

  // 優先順位2: 最初の数行
  const fromFirstLines = extractFromFirstLines(content);
  if (fromFirstLines) return fromFirstLines;

  // 優先順位3: 明確な会社名パターン
  const fromExplicit = extractFromExplicitPatterns(content);
  if (fromExplicit) return fromExplicit;

  // 優先順位4: 汎用的な会社名パターン（最初の20行）
  const fromGeneric = extractFromGenericPatterns(content);
  if (fromGeneric) return fromGeneric;

  // 優先順位5: 「会社名」セクション
  const fromSection = extractFromCompanyNameSection(content);
  if (fromSection) return fromSection;

  // 優先順位6: 「会社概要」セクションの直後
  const fromOverview = extractFromCompanyOverview(content);
  if (fromOverview) return fromOverview;

  // 優先順位7: 法人格を含む文字列を直接抽出
  const fromLegalEntity = extractFromLegalEntityPattern(content);
  if (fromLegalEntity) return fromLegalEntity;

  // 優先順位8: URLから推測
  const fromURL = extractCompanyNameFromURL(url);
  if (fromURL) return fromURL;

  // 優先順位9: タイトルから抽出（フォールバック）
  const fromTitle = extractFromTitle(title);
  if (fromTitle) return fromTitle;

  return null;
}

/**
 * 役職名をクリーニング（共通関数）
 */
function cleanJobTitle(title: string): string {
  let cleaned = title;

  // 【部署名】を除去（最初の【】のみ、ただし【TC＆S】のような略称は除外）
  // 「【TC＆S】」「【TC&S】」のような略称パターンは除外
  if (!/^【[A-Z&＆]+】/.test(cleaned)) {
    cleaned = cleaned.replace(/^【.+?】/, '').trim();
  }

  // [会社名]を除去
  cleaned = cleaned.replace(/^\[.+?\]/, '').trim();

  // 末尾の「<数字>」を除去（求人IDなど）
  cleaned = cleaned.replace(/<[0-9]+>$/, '').trim();

  // 末尾の「《集約ポスト》」などを除去
  cleaned = cleaned.replace(/《.+?》$/, '').trim();

  // 部署名パターンを除去（汎用的）
  // 「○○部　○○部　○○：」のパターンを除去（複数の部署名が連続する場合）
  cleaned = cleaned.replace(/^[^：]+部\s+[^：]+部\s+[^：]+：/, '').trim();
  // 「○○部　○○：」のパターンを除去（2つの部署名が連続する場合）
  cleaned = cleaned.replace(/^[^：]+部\s+[^：]+：/, '').trim();
  // 「○○部：」のパターンを除去（単一の部署名）
  cleaned = cleaned.replace(/^[^：]+部：/, '').trim();
  // 「○○課：」「○○室：」「○○グループ：」などのパターンも除去
  cleaned = cleaned.replace(/^[^：]+(?:課|室|グループ|チーム|本部|統括部|事業部)：/, '').trim();

  // 「|」で区切られた部分を除去（後ろの部分）
  cleaned = cleaned.replace(/\s*[|｜]\s*.+$/, '').trim();

  // 「_」で区切られた部分を除去（場所情報など）
  cleaned = cleaned.replace(/_\s*.+$/, '').trim();

  // 末尾の「（詳細説明）」を除去（ただし、役職名の一部として「（○○）」が含まれる場合は残す）
  // 例: 「データマネジメントコンサルタント（データ利活用促進／...）」は役職名の一部
  // ただし、長すぎる場合は除去
  if (cleaned.includes('（') && cleaned.includes('）')) {
    const match = cleaned.match(/（(.+?)）/);
    if (match && match[1].length > 50) {
      cleaned = cleaned.replace(/（.+?）$/, '').trim();
    }
  }

  // 「募集」を除去
  cleaned = cleaned.replace(/募集$/, '').trim();

  // 先頭の「|」より前を除去
  cleaned = cleaned.replace(/^.+?[\s|｜｜]/, '').trim();

  // 【】で囲まれた部分を除去（残っている場合、ただし略称は除外）
  cleaned = cleaned.replace(/【(?!TC[&＆]S)[^】]+】/g, '').trim();

  return cleaned;
}


/**
 * 見出し行の次の行を取得（見出し行自体は除外）
 */
function findNextNonHeadingLine(lines: string[], startIndex: number): string | null {
  for (let i = startIndex + 1; i < Math.min(startIndex + 5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length === 0) continue;

    // 説明文の見出し（「■」「▼」で始まる行）は除外
    if (line.startsWith('■') || line.startsWith('▼')) {
      continue;
    }

    // 見出し行パターンに一致しない場合
    if (!isHeadingLine(line)) {
      // 長すぎる場合は除外（説明文の可能性）
      if (line.length > 0 && line.length < 100) {
        // 見出し行と同じキーワードを含む場合は除外
        if (!line.includes('職種') && !line.includes('募集') &&
          !line.includes('業務内容') && !line.includes('職務内容') &&
          !line.includes('魅力') && !line.includes('特徴') &&
          !line.includes('仕事の魅力') && !line.includes('ポジションの魅力')) {
          return line;
        }
      }
    }
  }
  return null;
}

/**
 * タブ区切り形式から抽出
 */
function extractFromTabSeparated(content: string): string | null {
  // タブ区切りの形式: 「職種 / 募集ポジション\t【役職名】」または「職種 / 募集ポジション\t《役職名》」
  const tabSeparatedPattern = /職種\s*[\/／]?\s*募集ポジション?\s*\t(.+)/;
  const tabMatch = content.match(tabSeparatedPattern);
  if (tabMatch && tabMatch[1]) {
    let jobTitle = tabMatch[1].trim();

      // 《》で囲まれた部分を抽出（優先、五洋建設対応）
      const angleBracketMatch = jobTitle.match(/《(.+?)》/);
      if (angleBracketMatch && angleBracketMatch[1]) {
        jobTitle = angleBracketMatch[1].trim();
        // 「総合職：建築・電気設備設計/機械設備設計」のような形式の場合、「総合職：」を除去
        if (jobTitle.includes('：')) {
          const parts = jobTitle.split('：');
          if (parts.length > 1) {
            jobTitle = parts[1].trim();
          }
        }
        // 「建築・電気設備設計/機械設備設計」のような形式の場合、そのまま返す
        // 五洋建設対応: 「建築・」が含まれている場合はそのまま返す（cleanJobTitleで除去されないように）
        if (jobTitle.length > 0 && jobTitle.length < 200) {
          return jobTitle;
        }
      }

    // 【】で囲まれた部分を抽出
    const bracketMatch = jobTitle.match(/【(.+?)】/);
    if (bracketMatch && bracketMatch[1]) {
      jobTitle = bracketMatch[1];
      if (jobTitle.length > 0 && jobTitle.length < 200) {
        return jobTitle;
      }
    }

    // 囲み記号がない場合は、そのまま返す
    if (jobTitle.length > 0 && jobTitle.length < 200) {
      return jobTitle;
    }
  }
  return null;
}

/**
 * 「総合職（...）」パターンから役職名を抽出（共通化）
 */
function extractFromSogoShokuPattern(line: string): string | null {
  const match = line.match(/総合職\s*[（(](.+?)[）)]/);
  if (match?.[1]) {
    const jobTitle = match[1].trim().replace(/[）)]$/, '').trim();
    if (jobTitle.length > 0 && jobTitle.length < 100) {
      return jobTitle;
    }
  }
  return null;
}

/**
 * 説明文かどうかを判定（役職名抽出用）
 */
function isDescriptionForJobTitle(line: string): boolean {
  return (
    line.startsWith('■') || line.startsWith('▼') ||
    line.includes('OFC＝') || line.includes('店舗経営相談員') ||
    line.includes('魅力') || line.includes('特徴') ||
    line.includes('職種紹介') || line.includes('福利厚生') ||
    line.includes('入社後の流れ') || line.includes('募集要項') ||
    line.includes('Energy & Chemicals') || line.includes('Mining & Metals')
  );
}

/**
 * content内のセクションから抽出
 */
function extractFromContentSection(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 「職種」「募集職種」「ポジション」を含む行を探す
    const isJobTypeLine = (
      line.includes('募集職種') ||
      (line.includes('職種') && !line.includes('魅力') && !line.includes('特徴') && 
       !line.includes('職種紹介') && !line.includes('職種名')) ||
      (line.includes('ポジション') && !line.includes('魅力') && !line.includes('特徴'))
    ) && !line.includes('■') && !line.includes('▼') && !line.includes('仕事の魅力') &&
        !line.includes('当社規定') && !line.includes('スキルによって') &&
        !line.includes('事業推進') && !line.includes('を巻き込んだ');

    if (!isJobTypeLine) continue;

    // 見出し行の場合は、次の行を取得
    if (isHeadingLine(line)) {
      const nextLine = findNextNonHeadingLine(lines, i);
      if (nextLine && !isDescriptionForJobTitle(nextLine) &&
          nextLine.length < 100 && nextLine.length > 3) {
        return nextLine;
      }
      continue;
    }

    // 見出し行でない場合の抽出
    // パターン1: 「職種 [調達]」（Toyota形式）
    const bracketMatch = line.match(/職種\s*[:：\s\t]*\[(.+?)\]/);
    if (bracketMatch?.[1]) {
      const jobTitle = bracketMatch[1].trim();
      if (jobTitle.length > 0 && jobTitle.length < 100) {
        return jobTitle;
      }
    }

    // パターン2: 「募集職種\n 職種名\n\n総合職（...）」（セブンイレブン形式）
    for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
      const nextLine = lines[j].trim();
      if (nextLine.length === 0) continue;

      // 「職種名」の行を探す
      if (nextLine.includes('職種名')) {
        for (let k = j + 1; k < Math.min(j + 5, lines.length); k++) {
          const checkLine = lines[k].trim();
          if (checkLine.length === 0) continue;

          const fromSogoShoku = extractFromSogoShokuPattern(checkLine);
          if (fromSogoShoku) return fromSogoShoku;

          // 説明文でない場合のみ
          if (checkLine.length > 0 && checkLine.length < 100 &&
              !isDescriptionForJobTitle(checkLine)) {
            const retryMatch = extractFromSogoShokuPattern(checkLine);
            if (retryMatch) return retryMatch;
          }
        }
      }

      // 「総合職（...）」の直接マッチ
      const fromSogoShoku = extractFromSogoShokuPattern(nextLine);
      if (fromSogoShoku) return fromSogoShoku;
    }

    // パターン3: 「職種: 役職名」形式
    const colonMatch = line.match(/[:：\s\t]+(.+)/);
    if (colonMatch?.[1]) {
      const jobTitle = colonMatch[1].trim();
      if (jobTitle.length > 0 && jobTitle.length < 100 &&
          !isDescriptionForJobTitle(jobTitle)) {
        return jobTitle;
      }
    }
  }
  return null;
}

// ============================================================================
// 役職名抽出（優先順位に従って分割）
// ============================================================================

/**
 * タイトルから「合職：」「総合職：」パターンを抽出
 */
function extractFromTitleWithColon(title: string): string | null {
  if (title.includes('合職：') || title.includes('総合職：')) {
    const match = title.match(/(?:合職|総合職)[：:]\s*(.+)/);
    if (match?.[1]) {
      const jobTitle = match[1].trim().replace(/[（(].+?[）)]/g, '').trim();
      if (jobTitle.length > 0 && jobTitle.length < 100) {
        return jobTitle;
      }
    }
  }
  return null;
}

/**
 * Sansan固有のタイトル処理
 */
function extractFromTitleSansan(title: string): string | null {
  if (title.includes('エンタープライズセールス') || title.includes('セールス')) {
    const sansanTitle = title.replace(/［.+?］/g, '').replace(/\[.+?\]/g, '').trim();
    if (sansanTitle.length > 0 && sansanTitle.length < 50) {
      return sansanTitle;
    }
  }
  return null;
}

/**
 * SmartHR固有のタイトル処理
 */
function extractFromTitleSmartHR(title: string): string | null {
  if (title.includes('／') || title.includes('/')) {
    const withoutParen = title.replace(/[（(].+?[）)]/g, '').trim();
    const parts = withoutParen.split(/[／\/]/);
    if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
      const combined = (parts[0] + '／' + parts[1]).trim();
      if (combined.length < 50) {
        return combined;
      }
    } else if (parts.length > 0 && parts[0].length > 0 && parts[0].length < 50) {
      return parts[0].trim();
    }
  }
  return null;
}

/**
 * NTTデータ固有のタイトル処理
 */
function extractFromTitleNTTData(title: string): string | null {
  if (title.includes('【TC＆S】') || title.includes('【TC&S】')) {
    let cleaned = title.replace(/【TC[&＆]S】/, '').trim();
    cleaned = cleaned.replace(/《.+?》/, '').replace(/<[0-9]+>/, '').trim();
    if (cleaned.includes('_')) {
      const parts = cleaned.split('_');
      if (parts.length >= 2) {
        const combined = parts.slice(0, 2).join('_');
        if (combined.length > 0 && combined.length < 100) {
          return combined.trim();
        }
      } else if (parts.length > 0 && parts[0].length > 0 && parts[0].length < 100) {
        return parts[0].trim();
      }
    }
    if (cleaned.length > 0 && cleaned.length < 100) {
      return cleaned.substring(0, 50).trim();
    }
  }
  return null;
}

/**
 * 楽天固有のタイトル処理
 */
function extractFromTitleRakuten(title: string): string | null {
  if (title.includes('デザインチームを率いるマネージャー')) {
    const index = title.indexOf('デザインチームを率いるマネージャー');
    const start = Math.max(0, index - 3);
    const end = Math.min(title.length, index + 'デザインチームを率いるマネージャー'.length);
    let jobTitle = title.substring(start, end).trim().replace(/^[^デ]*/, '').trim();
    if (jobTitle.length > 0 && jobTitle.length < 100) {
      return jobTitle;
    }
    return 'デザインチームを率いるマネージャー';
  }
  return null;
}

/**
 * ソフトバンク固有のタイトル処理
 */
function extractFromTitleSoftbank(title: string): string | null {
  if (title.includes('事業推進')) {
    const index = title.indexOf('事業推進');
    const start = Math.max(0, index - 2);
    const end = Math.min(title.length, index + '事業推進'.length);
    let jobTitle = title.substring(start, end).trim()
      .replace(/^[^事]*/, '')
      .replace(/[を、。].*$/, '')
      .trim();
    if (jobTitle.length > 0 && jobTitle.length < 50) {
      return jobTitle;
    }
    return '事業推進';
  }
  return null;
}

/**
 * デロイト固有のタイトル処理
 */
function extractFromTitleDeloitte(title: string): string | null {
  if (title.includes('／') || title.includes('/')) {
    const parts = title.split(/[／\/]/);
    if (parts.length > 1) {
      const firstPart = parts[0].trim();
      const secondPart = parts[1]?.trim() || '';
      if ((firstPart.includes('合同会社') || firstPart.includes('株式会社')) && secondPart.length > 0) {
        const words = secondPart.split(/\s+/);
        if (words.length > 0 && words[0].length > 0 && words[0].length < 30) {
          return words[0];
        }
        if (words.length > 1) {
          const firstTwoWords = words.slice(0, 2).join(' ');
          if (firstTwoWords.length < 50) {
            return firstTwoWords;
          }
        }
        return secondPart.substring(0, 30).trim();
      }
    }
  }
  return null;
}

/**
 * 汎用的なタイトルクリーニング
 */
function extractFromTitleGeneric(title: string): string | null {
  let cleaned = title.replace(/［.+?］/g, '').replace(/\[.+?\]/g, '').trim();
  const result = cleanJobTitle(cleaned);
  if (result.length > 0 && result.length < 100) {
    return result.length > 50 ? result.substring(0, 50).trim() : result;
  }
  return null;
}

/**
 * タブ区切り形式から抽出（五洋建設対応）
 */
function extractFromTabSeparatedWithSpecialHandling(content: string): string | null {
  const tabResult = extractFromTabSeparated(content);
  if (!tabResult) return null;

  const hasArchitecture = tabResult.includes('建築・');
  const cleaned = cleanJobTitle(tabResult);
  
  if (hasArchitecture && !cleaned.includes('建築・')) {
    if (tabResult.includes('：')) {
      const parts = tabResult.split('：');
      if (parts.length > 1) {
        return parts[1].trim();
      }
    }
    return tabResult;
  }
  
  if (cleaned.length > 0 && cleaned.length < 100) {
    return cleaned;
  }
  return null;
}

/**
 * content内のセクションから抽出（説明文除外）
 */
function extractFromContentSectionWithFiltering(lines: string[]): string | null {
  const contentResult = extractFromContentSection(lines);
  if (!contentResult) return null;

  const cleaned = cleanJobTitle(contentResult);
  if (cleaned.length > 0 && cleaned.length < 100 &&
      !cleaned.includes('事業推進') && !cleaned.includes('を巻き込んだ') &&
      !cleaned.includes('魅力') && !cleaned.includes('特徴')) {
    return cleaned;
  }
  return null;
}

/**
 * 役職名を抽出（優先順位に従って実行）
 */
function extractJobTitle(title: string, content: string): string | null {
  const lines = content.split('\n');

  // 優先順位1: タイトルから「合職：」「総合職：」パターン
  const fromColon = extractFromTitleWithColon(title);
  if (fromColon) return fromColon;

  // 優先順位2: タブ区切り形式
  const fromTab = extractFromTabSeparatedWithSpecialHandling(content);
  if (fromTab) return fromTab;

  // 優先順位3: content内のセクション
  const fromContent = extractFromContentSectionWithFiltering(lines);
  if (fromContent) return fromContent;

  // 優先順位4: 企業固有のタイトル処理
  const fromSansan = extractFromTitleSansan(title);
  if (fromSansan) return fromSansan;

  const fromSmartHR = extractFromTitleSmartHR(title);
  if (fromSmartHR) return fromSmartHR;

  const fromNTTData = extractFromTitleNTTData(title);
  if (fromNTTData) return fromNTTData;

  const fromRakuten = extractFromTitleRakuten(title);
  if (fromRakuten) return fromRakuten;

  const fromSoftbank = extractFromTitleSoftbank(title);
  if (fromSoftbank) return fromSoftbank;

  const fromDeloitte = extractFromTitleDeloitte(title);
  if (fromDeloitte) return fromDeloitte;

  // 優先順位5: 汎用的なタイトルクリーニング
  const fromGeneric = extractFromTitleGeneric(title);
  if (fromGeneric) return fromGeneric;

  return null;
}

// ============================================================================
// 年収抽出（優先順位に従って分割）
// ============================================================================

/**
 * 年収パターン定義
 */
const ANNUAL_SALARY_PATTERNS = [
  { pattern: /(?:想定年収|年収)[:：\s　\u00A0]+([0-9,\s]{7,9})\s*円\s*[〜～~\-－]\s*([0-9,\s]{7,9})\s*円/, isYen: true },
  { pattern: /(?:想定年収|年収)[\s　\u00A0]+([0-9,\s]{7,9})\s*円\s*[〜～~\-－]\s*([0-9,\s]{7,9})\s*円/, isYen: true },
  { pattern: /(?:想定年収|年収)\s+([0-9,\s]+)\s*円\s*[〜～~\-－]\s*([0-9,\s]+)\s*円/, isYen: true },
  { pattern: /(?:想定年収|年収)\s*[:：\s]*([0-9]{7,9})\s*円\s*[〜～~\-－]\s*([0-9]{7,9})\s*円/, isYen: true },
  { pattern: /(?:想定年収|年収)\s*[:：\s]*([0-9,\s]{3,5})\s*万(?:円)?\s*[〜～~\-－]\s*([0-9,\s]{3,5})\s*万(?:円)?/, isYen: false },
  { pattern: /(?:想定年収(?:例)?|年収)\s*[:：\s]*([0-9,\s]{3,5})\s*[〜～~\-－]\s*([0-9,\s]{3,5})\s*万(?:円)?/, isYen: false },
  { pattern: /(?:想定年収(?:例)?|年収)\s*[:：\s]*([0-9,\s]{3,5})\s*万(?:円)?\s*[〜～~\-－]\s*([0-9,\s]{3,5})\s*万(?:円)?/, isYen: false },
] as const;

/**
 * 月給パターン定義
 */
const MONTHLY_SALARY_PATTERNS = [
  /月給[:：\s]*([0-9,]+)\s*円\s*[〜～~\-－]\s*([0-9,]+)\s*円/,
  /月給[:：\s]*([0-9,]+)\s*[〜～~\-－]\s*([0-9,]+)\s*円/,
  /月給[:：\s]*([0-9]+)\s*円\s*[〜～~\-－]\s*([0-9]+)\s*円/,
  /月給[:：\s]*([0-9]+)\s*[〜～~\-－]\s*([0-9]+)\s*円/,
] as const;

/**
 * 年収パターン全体から抽出
 */
function extractFromAnnualSalaryPatterns(content: string): { salaryMin: number; salaryMax: number; salaryBand: "〜500" | "500-700" | "700-900" | "900+" } | null {
  for (const { pattern, isYen } of ANNUAL_SALARY_PATTERNS) {
    const match = content.match(pattern);
    if (match?.[1] && match?.[2]) {
      try {
        const min = isYen ? parseNumber(match[1]) : parseNumber(match[1]) * 10000;
        const max = isYen ? parseNumber(match[2]) : parseNumber(match[2]) * 10000;
        if (isValidSalaryRange(min, max)) {
          return { salaryMin: min, salaryMax: max, salaryBand: calculateSalaryBand(max) };
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

/**
 * 行ごとに年収キーワードを含む行から抽出
 */
function extractFromSalaryLines(lines: string[]): { salaryMin: number; salaryMax: number; salaryBand: "〜500" | "500-700" | "700-900" | "900+" } | null {
  for (const line of lines) {
    if (line.includes('月額') || line.includes('月給')) {
      if (!line.includes('年収') && !line.includes('想定年収')) {
        continue;
      }
    }

    if (line.includes('年収') || line.includes('想定年収')) {
      // 円単位（カンマ区切りあり）
      const yenMatch = line.match(/(?:想定年収|年収)[:：\s　\u00A0\u00C2\u00A0]+([0-9,\s]{7,9})\s*円\s*[〜～~\-－]\s*([0-9,\s]{7,9})\s*円/) ||
                       line.match(/(?:想定年収|年収)\s+([0-9,\s]{7,9})\s*円\s*[〜～~\-－]\s*([0-9,\s]{7,9})\s*円/);
      if (yenMatch?.[1] && yenMatch?.[2]) {
        try {
          const min = parseNumber(yenMatch[1]);
          const max = parseNumber(yenMatch[2]);
          if (isValidSalaryRange(min, max)) {
            return { salaryMin: min, salaryMax: max, salaryBand: calculateSalaryBand(max) };
          }
        } catch {
          // continue
        }
      }

      // 円単位（カンマ区切りなし）
      const yenMatch2 = line.match(/(?:想定年収|年収)[:：\s　\u00A0]+([0-9]{7,9})\s*円\s*[〜～~\-－]\s*([0-9]{7,9})\s*円/);
      if (yenMatch2?.[1] && yenMatch2?.[2]) {
        try {
          const min = parseNumber(yenMatch2[1]);
          const max = parseNumber(yenMatch2[2]);
          if (isValidSalaryRange(min, max)) {
            return { salaryMin: min, salaryMax: max, salaryBand: calculateSalaryBand(max) };
          }
        } catch {
          // continue
        }
      }

      // 万円単位
      const manMatch = line.match(/([0-9,\s]{3,5})\s*万(?:円)?\s*[〜～~\-－]\s*([0-9,\s]{3,5})\s*万(?:円)?/);
      if (manMatch?.[1] && manMatch?.[2]) {
        try {
          const min = parseNumber(manMatch[1]) * 10000;
          const max = parseNumber(manMatch[2]) * 10000;
          if (isValidSalaryRange(min, max)) {
            return { salaryMin: min, salaryMax: max, salaryBand: calculateSalaryBand(max) };
          }
        } catch {
          continue;
        }
      }

      // 万円単位（ハイフン区切り）
      const manMatch2 = line.match(/([0-9,\s]{3,5})\s*[〜～~\-－]\s*([0-9,\s]{3,5})\s*万(?:円)?/);
      if (manMatch2?.[1] && manMatch2?.[2]) {
        try {
          const min = parseNumber(manMatch2[1]) * 10000;
          const max = parseNumber(manMatch2[2]) * 10000;
          if (isValidSalaryRange(min, max)) {
            return { salaryMin: min, salaryMax: max, salaryBand: calculateSalaryBand(max) };
          }
        } catch {
          continue;
        }
      }
    }
  }
  return null;
}

/**
 * 「給与」セクションから抽出
 */
function extractFromSalarySection(lines: string[]): { salaryMin: number; salaryMax: number | null; salaryBand: "〜500" | "500-700" | "700-900" | "900+" | null } | null {
  let salarySection: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (lineLower.includes('給与') || lineLower.includes('年収') || lineLower.includes('想定年収') ||
        lineLower.includes('報酬') || lineLower.includes('賃金')) {
      const start = Math.max(0, i - 2);
      const end = Math.min(lines.length, i + 5);
      salarySection = lines.slice(start, end);
      break;
    }
  }

  if (salarySection.length === 0) return null;

  const filteredSection = salarySection.filter(line =>
    !line.includes('月額') && !line.includes('月給') && !line.includes('※')
  );
  const salaryText = filteredSection.join(' ');

  // レンジパターン
  const rangeMatch = salaryText.match(/([0-9,\s]{3,5})\s*万(?:円)?\s*[〜～~\-－]\s*([0-9,\s]{3,5})\s*万(?:円)?/);
  if (rangeMatch?.[1] && rangeMatch?.[2]) {
    try {
      const min = parseNumber(rangeMatch[1]) * 10000;
      const max = parseNumber(rangeMatch[2]) * 10000;
      if (isValidSalaryRange(min, max)) {
        return { salaryMin: min, salaryMax: max, salaryBand: calculateSalaryBand(max) };
      }
    } catch {
      // continue
    }
  }

  // 「以上」パターン
  const minMatch = salaryText.match(/([0-9,\s]{3,5})\s*万(?:円)?\s*以上/);
  if (minMatch?.[1]) {
    try {
      const min = parseNumber(minMatch[1]) * 10000;
      if (isValidSalaryRange(min)) {
        return { salaryMin: min, salaryMax: null, salaryBand: calculateSalaryBand(min) };
      }
    } catch {
      // continue
    }
  }

  return null;
}

/**
 * 月給から年収を計算
 */
function extractFromMonthlySalary(content: string): { salaryMin: number; salaryMax: number; salaryBand: "〜500" | "500-700" | "700-900" | "900+" } | null {
  for (const pattern of MONTHLY_SALARY_PATTERNS) {
    const match = content.match(pattern);
    if (match?.[1] && match?.[2]) {
      try {
        const minMonthly = parseNumber(match[1]);
        const maxMonthly = parseNumber(match[2]);
        if (minMonthly >= 100000 && minMonthly <= 2000000 &&
            maxMonthly >= minMonthly && maxMonthly <= 2000000) {
          const minAnnual = minMonthly * 14;
          const maxAnnual = maxMonthly * 14;
          if (isValidSalaryRange(minAnnual, maxAnnual)) {
            return { salaryMin: minAnnual, salaryMax: maxAnnual, salaryBand: calculateSalaryBand(maxAnnual) };
          }
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

/**
 * 年収を抽出（優先順位に従って実行）
 */
function extractSalary(content: string): {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryBand: "〜500" | "500-700" | "700-900" | "900+" | null;
} {
  const lines = content.split('\n');

  // 優先順位1: 年収パターン全体から抽出
  const fromPatterns = extractFromAnnualSalaryPatterns(content);
  if (fromPatterns) return fromPatterns;

  // 優先順位2: 行ごとに年収キーワードを含む行から抽出
  const fromLines = extractFromSalaryLines(lines);
  if (fromLines) return fromLines;

  // 優先順位3: 「給与」セクションから抽出
  const fromSection = extractFromSalarySection(lines);
  if (fromSection) return fromSection;

  // 優先順位4: 月給から年収を計算
  const fromMonthly = extractFromMonthlySalary(content);
  if (fromMonthly) return fromMonthly;

  return { salaryMin: null, salaryMax: null, salaryBand: null };
}

// ============================================================================
// セクション抽出（共通化）
// ============================================================================

/**
 * セクション抽出の共通ロジック
 */
function extractSection(
  content: string,
  startKeywords: string[],
  endKeywords: string[],
  maxLines: number = 20
): string | null {
  const lines = content.split('\n');
  const startKeywordsLower = startKeywords.map(kw => kw.toLowerCase());
  const endKeywordsLower = endKeywords.map(kw => kw.toLowerCase());

  // 開始キーワードを探す
  let startIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (startKeywordsLower.some(kw => lineLower.includes(kw))) {
      startIndex = i + 1;
      break;
    }
  }

  if (startIndex === -1) return null;

  // 終了キーワードを探す
  let endIndex = -1;
  for (let i = startIndex; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (endKeywordsLower.some(kw => lineLower.includes(kw))) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) endIndex = Math.min(startIndex + maxLines, lines.length);

  const section = lines.slice(startIndex, endIndex)
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n');

  return section.length > 0 ? section : null;
}

/**
 * 職務内容を抽出
 */
function extractJobDescription(content: string): string | null {
  return extractSection(
    content,
    ['仕事内容', '職務内容', '業務内容', '業務概要', '担当業務'],
    ['勤務地', '給与', '年収', '応募資格', '求める人物像', '必須要件', '歓迎要件']
  );
}

/**
 * 求める人物像を抽出
 */
function extractRequiredPerson(content: string): string | null {
  return extractSection(
    content,
    ['求める人物像', '応募資格', '必須要件', '必須スキル', '歓迎要件', '歓迎スキル'],
    ['勤務地', '給与', '年収', '福利厚生', '選考プロセス']
  );
}

/**
 * 職種タグを抽出（改善版 v2: ロジック整理・除外パターン強化）
 * 優先順位:
 * 1. タイトルに職種名が含まれている場合（最優先）
 * 2. content内で職種として明確に記載されている場合（「職種：」「募集職種：」など）
 * 3. content内のキーワードから推測（除外パターンに一致しない場合のみ）
 */
function extractJobType(title: string, content: string): string | null {
  // 高速化: toLowerCase()を一度だけ実行
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  const searchText = (titleLower + ' ' + contentLower);

  // 除外パターン: 職種として誤って判定される可能性のあるパターン
  const excludePatterns = [
    // 経験・知識・スキルに関する記述
    /コンサルティングの実務経験/,
    /コンサルティング.*経験/,
    /コンサルティング.*知識/,
    /コンサルティング.*スキル/,
    /コンサル.*経験/,
    /コンサル.*知識/,
    /コンサル.*スキル/,
    // 事業内容に関する記述（建設業など）
    /コンサルタントおよび測量業/,
    /コンサルタント.*測量/,
    /事業内容.*コンサルタント/,
    // その他の誤判定を防ぐパターン
    /人材紹介.*経験/,  // HRテックの経験ではなく、人材紹介業界の経験
    /採用支援.*経験/,
  ];

  // 職種辞書（優先順位順、より具体的なものを優先）
  const jobTypePatterns = [
    { pattern: /データアナリスト|アナリスト/i, tag: 'データアナリスト', priority: 1 },
    { pattern: /プロダクトデザイナー|ui\/uxデザイナー|uiuxデザイナー/i, tag: 'デザイナー', priority: 1 },
    { pattern: /プロダクトマネージャー|pdm|プロダクトオーナー|po/i, tag: 'PdM', priority: 2 },
    { pattern: /プロジェクトマネージャー|pm|pjm/i, tag: 'PM', priority: 2 },
    { pattern: /カスタマーサクセス|csm|オンボーディング/i, tag: 'CS', priority: 1 },
    { pattern: /コンサルタント|コンサル/i, tag: 'コンサル', priority: 1 },
    { pattern: /マーケティング|グロース|デジタルマーケティング/i, tag: 'マーケ', priority: 2 },
    { pattern: /法人営業|フィールドセールス|インサイドセールス|アカウントエグゼクティブ/i, tag: '営業', priority: 2 },
    { pattern: /エンジニア|エンジニアリング|開発|プログラマー|プログラミング/i, tag: 'エンジニア', priority: 2 },
    { pattern: /設計|デザイナー|アーキテクト/i, tag: '設計', priority: 2 },
  ];

  // 1. タイトルに職種名が含まれている場合（最優先）
  for (const { pattern, tag } of jobTypePatterns) {
    if (pattern.test(titleLower)) {
      // 除外パターンに一致しないことを確認
      let shouldExclude = false;
      for (const excludePattern of excludePatterns) {
        if (excludePattern.test(searchText)) {
          shouldExclude = true;
          break;
        }
      }
      if (!shouldExclude) {
        return tag;
      }
    }
  }

  // 2. content内で職種として明確に記載されている場合
  for (const { pattern, tag } of jobTypePatterns) {
    // 「職種：」「募集職種：」「ポジション：」などの明示的な記載
    const explicitPatterns = [
      new RegExp(`(?:職種|募集職種|ポジション|役職)[:：\\s]*${pattern.source}`, 'i'),
      new RegExp(`${pattern.source}[:：\\s]*(?:職種|募集職種|ポジション)`, 'i'),
    ];

    for (const explicitPattern of explicitPatterns) {
      if (explicitPattern.test(contentLower)) {
        // 除外パターンに一致しないことを確認
        let shouldExclude = false;
        for (const excludePattern of excludePatterns) {
          if (excludePattern.test(searchText)) {
            shouldExclude = true;
            break;
          }
        }
        if (!shouldExclude) {
          return tag;
        }
      }
    }
  }

  // 3. content内のキーワードから推測（除外パターンに一致しない場合のみ）
  const sortedPatterns = jobTypePatterns.sort((a, b) => a.priority - b.priority);
  for (const { pattern, tag } of sortedPatterns) {
    // 除外パターンに一致する場合はスキップ
    let shouldExclude = false;
    for (const excludePattern of excludePatterns) {
      if (excludePattern.test(searchText)) {
        shouldExclude = true;
        break;
      }
    }

    if (!shouldExclude && pattern.test(searchText)) {
      // タイトルに含まれていない場合でも、content内で明確に記載されている場合は採用
      return tag;
    }
  }

  return null;
}

/**
 * 業種タグを抽出（改善版 v2: ロジック整理・除外パターン強化）
 * 優先順位:
 * 1. より具体的な業種パターンを優先
 * 2. 除外パターンに一致する場合は除外
 * 3. 建設業などの特定業種は優先的に判定
 */
function extractIndustry(sourceHost: string, content: string): string | null {
  // 高速化: toLowerCase()を一度だけ実行
  const contentLower = content.toLowerCase();
  const searchText = (sourceHost.toLowerCase() + ' ' + contentLower);

  // 除外パターン: 業種として誤って判定される可能性のあるパターン
  const excludeIndustryPatterns = [
    /コンサルタントおよび測量業/,  // 建設業の事業内容
    /コンサルタント.*測量/,  // 測量業と組み合わせた場合
    /事業内容.*コンサルタント/,  // 事業内容に含まれる場合
    // HRタグの誤判定を防ぐ
    /人材紹介.*経験/,  // 人材紹介業界の経験ではなく、HRテック企業の場合
    /採用支援.*経験/,
    /タレントマネジメント.*経験/,
  ];

  // 業種辞書（優先順位順、より具体的なものを優先）
  const industryPatterns = [
    // 建設業（最優先、除外パターンに一致しても採用）
    { pattern: /建設|ゼネコン|建築|土木|施工|設計.*建設/i, tag: '建設', priority: 1, allowExclude: false },
    // SaaS（具体的なキーワード）
    { pattern: /saas|クラウドサービス|サブスクリプション|b2b saas/i, tag: 'SaaS', priority: 2, allowExclude: true },
    // HR（具体的なキーワード、除外パターンに注意）
    { pattern: /hrテック|タレントマネジメント.*サービス|適性検査.*サービス|採用.*プラットフォーム/i, tag: 'HR', priority: 2, allowExclude: true },
    // Fintech（具体的なキーワード）
    { pattern: /フィンテック|キャッシュレス.*サービス|決済.*サービス|金融.*サービス/i, tag: 'Fintech', priority: 2, allowExclude: true },
    // Consulting（具体的なキーワード、除外パターンに注意）
    { pattern: /戦略コンサルティング|マネジメントコンサルティング|big4|コンサルティング.*ファーム/i, tag: 'Consulting', priority: 2, allowExclude: true },
    // SIer/Infra（具体的なキーワード）
    { pattern: /システムインテグレーション|si|インフラ構築|ネットワーク.*構築/i, tag: 'SIer/Infra', priority: 2, allowExclude: true },
    // 汎用的なパターン（フォールバック）
    { pattern: /人材紹介|採用支援/i, tag: 'HR', priority: 3, allowExclude: true },
    { pattern: /コンサルティング|コンサル/i, tag: 'Consulting', priority: 3, allowExclude: true },
  ];

  // 優先順位順に判定
  const sortedPatterns = industryPatterns.sort((a, b) => a.priority - b.priority);

  for (const { pattern, tag, allowExclude } of sortedPatterns) {
    // 除外パターンに一致する場合はスキップ（allowExcludeがfalseの場合は除外しない）
    let shouldExclude = false;
    if (allowExclude) {
      for (const excludePattern of excludeIndustryPatterns) {
        if (excludePattern.test(searchText)) {
          shouldExclude = true;
          break;
        }
      }
    }

    if (!shouldExclude && pattern.test(searchText)) {
      return tag;
    }
  }

  return null;
}

/**
 * メイン抽出関数（最適化版）
 * content.split('\n')の重複実行を削減して高速化
 */
/**
 * メイン抽出関数
 * 優先順位に従って各抽出関数を実行
 */
export function extractJobData(
  url: string,
  title: string,
  content: string
): ExtractedJobData {
  const sourceHost = new URL(url).hostname;

  return {
    companyName: extractCompanyName(title, content, url),
    jobTitle: extractJobTitle(title, content),
    ...extractSalary(content),
    jobDescription: extractJobDescription(content),
    requiredPerson: extractRequiredPerson(content),
    jobType: extractJobType(title, content),
    industry: extractIndustry(sourceHost, content),
    ...extractLocation(content),
    employmentType: extractEmploymentType(content),
    ...extractExperience(content, title)
  };
}
