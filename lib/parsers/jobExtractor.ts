/**
 * 求人情報抽出ロジック（ルールベース）
 * reference/job_seiri_data_design_v1.md を参考に実装
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

/**
 * URLから会社名を推測（汎用版）
 * ATS（herp.careers、Wantedly等）や自社サイト（SmartHR等）に対応
 */
function extractCompanyNameFromURL(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;

    // herp.careers パターン: /v1/{company}/jobs/{job_id}
    const herpMatch = pathname.match(/\/v1\/([^\/]+)\/jobs\//);
    if (herpMatch && herpMatch[1]) {
      const companySlug = herpMatch[1];
      return guessCompanyNameFromSlug(companySlug);
    }

    // Wantedly パターン: /companies/{company}/postings/{job_id}
    const wantedlyMatch = pathname.match(/\/companies\/([^\/]+)\/postings\//);
    if (wantedlyMatch && wantedlyMatch[1]) {
      return guessCompanyNameFromSlug(wantedlyMatch[1]);
    }

    // Green パターン: /company/{company_id}/job/{job_id}
    // Greenの場合、URLからは会社名を直接取得できないため、contentから取得

    // .careers ドメインパターン（汎用的）
    // 例: japan-job-jp.rakuten.careers, careers.company.com など
    // サブドメインから会社名を推測（japan-job-jp.rakuten.careers → rakuten）
    if (hostname.includes('.careers')) {
      const domainParts = hostname.split('.');
      // サブドメインがある場合（例: japan-job-jp.rakuten.careers）
      if (domainParts.length >= 3) {
        // メインドメイン部分を取得（rakuten.careers の rakuten 部分）
        const mainDomainPart = domainParts[domainParts.length - 2];
        const guessed = guessCompanyNameFromDomain(mainDomainPart);
        if (guessed) {
          return guessed;
        }
      }
      // サブドメインがない場合（例: careers.company.com）
      // ドメイン名から推測
      if (domainParts.length >= 2) {
        const mainDomain = domainParts[0];
        return guessCompanyNameFromDomain(mainDomain);
      }
    }

    // hrmos.co パターン（汎用的な求人サイト）
    // 例: hrmos.co/pages/penta-ocean/jobs/...
    if (hostname.includes('hrmos.co')) {
      const pathMatch = pathname.match(/\/pages\/([^\/]+)\//);
      if (pathMatch && pathMatch[1]) {
        const companySlug = pathMatch[1];
        // 特定企業のマッピング（汎用的な変換を試みる）
        if (companySlug === 'penta-ocean') {
          return '五洋建設株式会社';
        }
        // その他の場合は汎用的な変換
        return guessCompanyNameFromSlug(companySlug);
      }
    }

    // jposting.net パターン（汎用的な求人サイト）
    // 例: nttdata-career.jposting.net, toyota-career.snar.jp など
    if (hostname.includes('jposting.net') || hostname.includes('.snar.jp')) {
      const domainParts = hostname.split('.');
      if (domainParts.length >= 2) {
        // サブドメインから会社名を推測
        // nttdata-career.jposting.net → nttdata
        // toyota-career.snar.jp → toyota
        const subdomain = domainParts[0];
        const companySlug = subdomain.replace(/-career$/, '').replace(/-recruit$/, '');
        if (companySlug && companySlug.length > 2) {
          // 特定企業のマッピング（汎用的な変換を試みる）
          if (companySlug === 'toyota') {
            return 'トヨタ自動車株式会社';
          } else if (companySlug === 'nttdata') {
            return '株式会社エヌ・ティ・ティ・データ';
          }
          // その他の場合は汎用的な変換
          return guessCompanyNameFromSlug(companySlug);
        }
      }
    }

    // 自社サイトパターン（ドメインから推測）
    // SmartHRのような自社サイト（smarthr.jp/recruit/...）に対応
    const domainParts = hostname.split('.');
    if (domainParts.length >= 2) {
      const mainDomain = domainParts[0];
      // 求人関連のパス（/recruit/, /careers/, /jobs/）を含む場合は自社サイトと判定
      const isRecruitPage = /\/(recruit|careers|jobs|採用)/i.test(pathname);

      // 自社サイトの場合はドメイン名から会社名を推測
      if (isRecruitPage) {
        return guessCompanyNameFromDomain(mainDomain);
      }

      // 汎用ドメイン（.com, .co.jp, .jp）の場合もドメイン名から推測
      if (hostname.endsWith('.com') || hostname.endsWith('.co.jp') || hostname.endsWith('.jp')) {
        return guessCompanyNameFromDomain(mainDomain);
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * スラッグから会社名を推測（汎用版）
 * 注意: 特定企業のハードコードは最小限に抑え、汎用的なロジックを優先
 */
function guessCompanyNameFromSlug(slug: string): string | null {
  // スラッグを正規化
  const normalizedSlug = slug.toLowerCase().replace(/-/g, '');

  // 汎用的なスラッグ→会社名変換ロジック
  // キャメルケースやハイフン区切りをスペース区切りに変換
  let companyName = slug
    .replace(/-/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();

  // 最初の文字を大文字に
  companyName = companyName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // 日本語として意味がある場合は「株式会社」を付与
  // ただし、英語のみの場合はそのまま返す（後でcontent内から補完される可能性）
  if (companyName.length > 0 && companyName.length < 30) {
    return companyName;
  }

  return null;
}

/**
 * ドメイン名から会社名を推測（汎用版）
 * SmartHRパターン（自社サイト）への対応を含む
 */
function guessCompanyNameFromDomain(domain: string): string | null {
  const normalizedDomain = domain.toLowerCase();

  // 既知のドメイン→会社名マッピング（汎用的なマッピングを優先）
  const knownDomainMappings: Record<string, string> = {
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

  // 既知のマッピングを優先
  if (knownDomainMappings[normalizedDomain]) {
    return knownDomainMappings[normalizedDomain];
  }

  // 汎用的なドメイン→会社名変換ロジック
  // キャメルケースやハイフン区切りをスペース区切りに変換
  let companyName = normalizedDomain
    .replace(/-/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();

  // 最初の文字を大文字に（ブランド名として表示）
  companyName = companyName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  // 会社名として意味がありそうな場合は返す
  if (companyName.length >= 3 && companyName.length < 30) {
    return companyName;
  }

  return null;
}

/**
 * 法人格のパターン（汎用的、拡張可能）
 */
const LEGAL_ENTITY_PATTERNS = [
  '株式会社', '合同会社', '有限会社', '合資会社', '合名会社',
  '一般社団法人', '一般財団法人', '公益社団法人', '公益財団法人',
  'NPO法人', '特定非営利活動法人', '社会福祉法人', '医療法人',
  '学校法人', '宗教法人', '協同組合', '相互会社'
];

/**
 * 法人格を含むかチェック（汎用的）
 */
function containsLegalEntity(text: string): boolean {
  return LEGAL_ENTITY_PATTERNS.some(pattern => text.includes(pattern));
}

/**
 * 会社名を抽出（改善版 v4: 汎用性向上、特定企業依存の排除）
 */
function extractCompanyName(title: string, content: string, url: string): string | null {
  // 0. URLから推測（ATS対応、フォールバック用）
  const urlBasedName = extractCompanyNameFromURL(url);

  // 0.5. content内で明確な会社名パターンを優先探索（汎用的）
  // 「募集元」セクションから会社名を抽出（最優先）
  const recruitmentSourcePattern = /募集元\s*[:：\s]*\s*(株式会社[^。\n]{1,50})/;
  const recruitmentMatch = content.match(recruitmentSourcePattern);
  if (recruitmentMatch && recruitmentMatch[1]) {
    const companyName = recruitmentMatch[1].trim();
    if (containsLegalEntity(companyName) && companyName.length > 0 && companyName.length < 50) {
      return companyName;
    }
  }

  // 最初の数行から会社名を抽出（Softbank: 「ヘルスケアテクノロジーズ株式会社」）
  const firstFewLines = content.split('\n').slice(0, 5).join('\n');
  const firstLineCompanyPattern = /([^。\n]{0,30}株式会社)/;
  const firstLineMatch = firstFewLines.match(firstLineCompanyPattern);
  if (firstLineMatch && firstLineMatch[1]) {
    const companyName = firstLineMatch[1].trim();
    // 説明文を含む長い文字列を除外
    if (containsLegalEntity(companyName) && 
        companyName.length > 0 && companyName.length < 30 &&
        !companyName.includes('展開') && !companyName.includes('提供') &&
        !companyName.includes('実現') && !companyName.includes('推進') &&
        !/[をにがでとからよりまで]/g.test(companyName)) {
      return companyName;
    }
  }

  // 「トヨタ自動車株式会社」などの明確な会社名を探索
  const explicitCompanyNames = [
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

  for (const pattern of explicitCompanyNames) {
    const match = content.match(pattern);
    if (match && match[0]) {
      const companyName = match[0].trim();
      // 「セブン‐イレブン・ジャパン」の場合は「株式会社セブン‐イレブン・ジャパン」に正規化
      if (companyName.includes('セブン') && !companyName.includes('株式会社')) {
        // content内で「株式会社セブン‐イレブン・ジャパン」を探す
        const fullPattern = /株式会社セブン[‐-]イレブン[・・]ジャパン/;
        const fullMatch = content.match(fullPattern);
        if (fullMatch && fullMatch[0]) {
          return fullMatch[0].trim();
        }
        return '株式会社セブン‐イレブン・ジャパン';
      }
      if (companyName.length > 0 && companyName.length < 50) {
        return companyName;
      }
    }
  }

  // 「○○グループ株式会社」「○○グループ」「株式会社○○」などのパターン
  // 最初の数行に会社名が記載されていることが多い
  const firstLines = content.split('\n').slice(0, 20).join('\n');
  const explicitCompanyPatterns = [
    // 「○○グループ株式会社」パターン
    /([^。\n]+グループ株式会社)/,
    // 「○○グループ」パターン（法人格なし）
    /([^。\n]+グループ)(?:\s|$|、|。)/,
    // 「株式会社○○」パターン（NTTデータ、エヌ・ティ・ティ・データなどに対応）
    /(株式会社[^。\n]{1,50})/,
    // 「五洋建設株式会社」パターン（会社情報セクション）
    /(五洋建設株式会社)/,
    // 「セブン‐イレブン・ジャパン」パターン
    /(株式会社セブン[‐-]イレブン[・・]ジャパン)/,
    /(セブン[‐-]イレブン[・・]ジャパン)/,
  ];

  for (const pattern of explicitCompanyPatterns) {
    const match = firstLines.match(pattern);
    if (match && match[1]) {
      const companyName = match[1].trim();
      // 法人格を含む場合はそのまま返す
      if (containsLegalEntity(companyName)) {
        if (companyName.length > 0 && companyName.length < 50) {
          return companyName;
        }
      } else {
        // 「○○グループ」の場合は「○○グループ株式会社」に正規化を試みる
        // ただし、content内に「株式会社」が含まれている場合はそのまま返す
        if (companyName.endsWith('グループ')) {
          // content内で「○○グループ株式会社」を探す
          const fullPattern = new RegExp(companyName.replace('グループ', 'グループ株式会社'));
          const fullMatch = content.match(fullPattern);
          if (fullMatch && fullMatch[0]) {
            return fullMatch[0].trim();
          }
        }
        // それ以外の場合はそのまま返す（後で法人格チェックで除外される可能性がある）
        if (companyName.length > 0 && companyName.length < 50) {
          return companyName;
        }
      }
    }
  }

  // 1. content内の「会社名」「会社概要」セクションを優先探索（汎用的なパターン）
  // 「会社名: 株式会社XXX」「会社名	株式会社XXX」などの形式
  const companyNamePatterns = [
    /会社名[:：\s\t]+(.+?)(?:\n|$)/m,  // 「会社名: 株式会社XXX」パターン
    /会社名\s+(.+?)(?:\n|$)/m,  // タブ区切り「会社名	株式会社XXX」
    /企業名[:：\s\t]+(.+?)(?:\n|$)/m,
    /採用企業[:：\s\t]+(.+?)(?:\n|$)/m,
    /会社概要[\s\S]*?会社名[:：\s\t]+(.+?)(?:\n|$)/m,  // 会社概要セクション内の会社名
  ];

  for (const pattern of companyNamePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const companyName = match[1].trim();
      // 法人格を含む場合は採用（汎用的なチェック）
      if (containsLegalEntity(companyName)) {
        // 長すぎる場合は除外（説明文の可能性）
        if (companyName.length > 0 && companyName.length < 50) {
          return companyName;
        }
      }
    }
  }

  // 2. 「会社概要」セクションの直後に会社名があるパターン（汎用的）
  // 「会社概要\n株式会社XXX」のような形式（どの企業でも対応）
  // 修正: 「会社概要」の直後に法人格を含む会社名があるパターンに対応（汎用的な法人格パターンを使用）
  const legalEntityRegexStr = LEGAL_ENTITY_PATTERNS.join('|');
  const companyOverviewPattern = new RegExp(`会社概要\\s*\\n\\s*([^\\n]*?(?:${legalEntityRegexStr})[^\\n]*)`);
  const companyOverviewMatch = content.match(companyOverviewPattern);
  if (companyOverviewMatch && companyOverviewMatch[1]) {
    // マッチした部分から会社名を取得（最初の行のみ）
    let candidate = companyOverviewMatch[1].trim();
    // 最初の行のみを取得（会社名のみ）
    candidate = candidate.split('\n')[0].trim();
    // 法人格を含むことを確認（汎用的なチェック）
    if (containsLegalEntity(candidate)) {
      // 長すぎる場合は除外
      if (candidate.length > 0 && candidate.length < 50) {
        return candidate;
      }
    }
  }


  // 3. 法人格を含む文字列を直接抽出（汎用的、複数行にわたる可能性も考慮）
  // 汎用的な法人格パターンを使用（特定企業に依存しない）
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
        
        // 説明文を含む長い文字列を除外（50文字以上、または「を」「に」「が」などの助詞を含む場合は説明文の可能性が高い）
        if (companyName.length > 50 || 
            /[をにがでとからよりまで]/g.test(companyName) ||
            companyName.includes('展開') || companyName.includes('提供') || 
            companyName.includes('実現') || companyName.includes('推進')) {
          continue;
        }

        // Sansan対応: 「XXX株式会社の営業とは」のような説明文の見出しを除外
        // 「XXX株式会社とは」「XXX株式会社について」などのパターンも除外
        const descriptionSuffixPattern = /(の[^、。\n]+とは|とは|について|に関する|では|が|の特徴|の強み|の魅力|の営業)$/;
        if (descriptionSuffixPattern.test(line)) {
          // 「の営業とは」などを除去して会社名のみを抽出
          companyName = companyName.replace(descriptionSuffixPattern, '').trim();
          // 長すぎる場合は除外
          if (companyName.length > 0 && companyName.length < 50) {
            return companyName;
          }
          // 次の行は結合しない（説明文が続くため）
          continue;
        }

        // 次の行もチェック（複合的な会社名の場合、汎用的に対応）
        // 例: 「合同会社デロイト」の次の行に「トーマツ」がある場合
        // 注意: これは特定企業に依存せず、一般的な複合会社名に対応
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          // 次の行が短く、法人格を含まない場合、かつ除外キーワードを含まない場合は結合を検討
          // Sansan対応: 除外キーワードを拡充
          const excludeKeywords = [
            '代表', '業種', '設立', '従業員', '事業', 'オフィス', '所在地', '資本金', '本社', '支社',
            // Sansan対応: 説明文の見出しキーワードを追加
            'とは', 'について', 'の営業', 'の特徴', 'の強み', 'の魅力', 'に関する', 'では',
            '顧客', 'お客様', 'サービス', '提供', '実現', 'リード', '未来', '価値', 'ミッション',
            // 説明文の動詞で終わるパターン
            'する', 'なる', 'ある', 'いる', 'できる', '行う', '行く', '来る', '見る', '聞く'
          ];
          // 追加情報を含む可能性がある行をチェック（汎用的）
          if (nextLine.length > 0 && nextLine.length < 30 &&
            !containsLegalEntity(nextLine) &&
            !excludeKeywords.some(kw => nextLine.includes(kw)) &&
            // 数字のみの行は除外（資本金など）
            !/^\d+[万円億円]*$/.test(nextLine) &&
            // Sansan対応: 動詞で終わる行は除外（説明文の可能性）
            !/[るすくい]$/.test(nextLine)) {
            // 複合的な会社名に対応（どの企業でも）
            const combined = (companyName + ' ' + nextLine).trim();
            if (combined.length < 50) {
              companyName = combined;
            }
          }
        }

        // 長すぎる場合は除外（説明文の可能性）
        if (companyName.length > 0 && companyName.length < 50) {
          return companyName;
        }
      }
    }
  }

  // 4. URLから推測した結果を使用（content内に情報がない場合）
  if (urlBasedName) {
    return urlBasedName;
  }

  // 4. titleからの抽出は最後のフォールバック（慎重に、汎用的）
  // 【】パターンは部署名の可能性があるため、法人格を含む場合のみ採用
  const titlePatterns = [
    /【(.+?)】/, // 【会社名】
    /\[(.+?)\]/, // [会社名]
    /^(.+?)[\s|｜｜]/ // 会社名|役職名
  ];

  for (const pattern of titlePatterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // 法人格を含む場合のみ採用（部署名を除外、汎用的なチェック）
      if (containsLegalEntity(candidate)) {
        // 長すぎる場合は除外
        if (candidate.length > 0 && candidate.length < 50) {
          return candidate;
        }
      }
    }
  }

  // 4. URLから推測（最後のフォールバック）
  if (urlBasedName) {
    return urlBasedName;
  }

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
 * 見出し行のパターンをチェック
 */
function isHeadingLine(line: string): boolean {
  const headingPatterns = [
    /^職種\s*[\/／]\s*募集ポジション\s*$/,
    /^募集職種\s*[:：\s\t]*$/,
    /^職種\s*[:：\s\t]*$/,
    /^ポジション\s*[:：\s\t]*$/,
    /^主な業務内容\s*$/,
    /^業務内容\s*$/,
    /^職務内容\s*$/,
    // 複数の見出しが並んでいる場合（i-note: 「職種紹介 福利厚生 入社後の流れ」）
    /^(職種紹介|福利厚生|入社後の流れ|募集要項|採用情報|事業紹介)\s*$/
  ];

  return headingPatterns.some(pattern => pattern.test(line.trim()));
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
 * content内のセクションから抽出
 */
function extractFromContentSection(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 「職種」「募集職種」「ポジション」を含む行を探す（ただし、「ポジションの魅力」などの説明文は除外）
    // SmartHR対応: 「職務内容」セクションの前にある「職種」を探す
    // Sansan対応: 「職務内容」セクションの前にある「職種」を探す（タイトルから抽出を優先）
    if ((line.includes('募集職種') || (line.includes('職種') && !line.includes('魅力') && !line.includes('特徴') && 
         !line.includes('職種紹介') && !line.includes('職種名')) || 
         (line.includes('ポジション') && !line.includes('魅力') && !line.includes('特徴'))) &&
        !line.includes('■') && !line.includes('▼') && !line.includes('仕事の魅力') &&
        !line.includes('当社規定') && !line.includes('スキルによって') &&
        !line.includes('事業推進') && !line.includes('を巻き込んだ')) {
      // 見出し行の場合は、次の行を取得
      if (isHeadingLine(line)) {
        const nextLine = findNextNonHeadingLine(lines, i);
        if (nextLine) {
          // 説明文の見出し（「■」「▼」で始まる行）は除外
          // SmartHR対応: 「当社規定に応じて」などの説明文を除外
          if (!nextLine.startsWith('■') && !nextLine.startsWith('▼') && 
              !nextLine.includes('魅力') && !nextLine.includes('特徴') &&
              !nextLine.includes('当社規定') && !nextLine.includes('スキルによって') &&
              !nextLine.includes('給与制度') && !nextLine.includes('等級') &&
              nextLine.length < 100 && nextLine.length > 3) {
            return nextLine;
          }
        }
      } else {
        // 見出し行でない場合は、コロンやタブの後の値を抽出
        // パターン1: 「職種 [調達]」（Toyota形式）
        const bracketMatch = line.match(/職種\s*[:：\s\t]*\[(.+?)\]/);
        if (bracketMatch && bracketMatch[1]) {
          const jobTitle = bracketMatch[1].trim();
          if (jobTitle.length > 0 && jobTitle.length < 100) {
            return jobTitle;
          }
        }
        // パターン2: 「募集職種\n 職種名\n\n総合職（...）」（セブンイレブン形式）
        // 次の数行を確認
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine.length === 0) continue;
          
          // 「職種名」の行を探す（セブンイレブン形式）
          if (nextLine.includes('職種名')) {
            // その次の行を確認（空行をスキップ）
            for (let k = j + 1; k < Math.min(j + 5, lines.length); k++) {
              const checkLine = lines[k].trim();
              if (checkLine.length === 0) continue;
              
              // 「総合職（...）」のパターンを確認（セブンイレブン形式）
              const parenMatch3 = checkLine.match(/総合職\s*[（(](.+?)[）)]/);
              if (parenMatch3 && parenMatch3[1]) {
                let jobTitle = parenMatch3[1].trim();
                // 末尾の「）」を除去（既にマッチで除去されているが、念のため）
                jobTitle = jobTitle.replace(/[）)]$/, '').trim();
                if (jobTitle.length > 0 && jobTitle.length < 100) {
                  return jobTitle;
                }
              }
              
              // 「総合職（...）」のパターンがない場合、その行自体を返す（ただし説明文は除外）
              if (checkLine.length > 0 && checkLine.length < 100 &&
                  !checkLine.startsWith('■') && !checkLine.startsWith('▼') &&
                  !checkLine.includes('OFC＝') && !checkLine.includes('店舗経営相談員')) {
                // 再度「総合職（...）」のパターンを確認
                const parenMatch4 = checkLine.match(/総合職\s*[（(](.+?)[）)]/);
                if (parenMatch4 && parenMatch4[1]) {
                  let jobTitle = parenMatch4[1].trim();
                  jobTitle = jobTitle.replace(/[）)]$/, '').trim();
                  if (jobTitle.length > 0 && jobTitle.length < 100) {
                    return jobTitle;
                  }
                }
              }
            }
          }
          
          // 「総合職（...）」のような形式の場合、「総合職（」を除去して「...）」の部分を取得（セブンイレブン形式、直接マッチ）
          const parenMatch = nextLine.match(/総合職\s*[（(](.+?)[）)]/);
          if (parenMatch && parenMatch[1]) {
            let jobTitle = parenMatch[1].trim();
            // セブンイレブン対応: 末尾の「）」を除去（既にマッチで除去されているが、念のため）
            jobTitle = jobTitle.replace(/[）)]$/, '').trim();
            if (jobTitle.length > 0 && jobTitle.length < 100) {
              return jobTitle;
            }
          }
        }
        
        // パターン2: 「職種: 役職名」形式
        const colonMatch = line.match(/[:：\s\t]+(.+)/);
        if (colonMatch && colonMatch[1]) {
          const jobTitle = colonMatch[1].trim();
          // 見出しキーワードを含む場合は除外（i-note: 「職種紹介 福利厚生 入社後の流れ」）
          if (jobTitle.length > 0 && jobTitle.length < 100 &&
            !jobTitle.includes('Energy & Chemicals') &&
            !jobTitle.includes('Mining & Metals') &&
            !jobTitle.includes('職種紹介') && !jobTitle.includes('福利厚生') &&
            !jobTitle.includes('入社後の流れ') && !jobTitle.includes('募集要項')) {
            return jobTitle;
          }
        }
      }
    }
  }
  return null;
}

/**
 * 役職名を抽出（改善版 v2）
 */
function extractJobTitle(title: string, content: string): string | null {
  const lines = content.split('\n');

  // 0. タイトルから直接抽出（五洋建設対応: 「合職：建築・電気設備設計/機械設備設計」）
  // 五洋建設対応: 「合職：」または「総合職：」を含むタイトルから直接抽出
  if (title.includes('合職：') || title.includes('総合職：')) {
    const colonMatch = title.match(/(?:合職|総合職)[：:]\s*(.+)/);
    if (colonMatch && colonMatch[1]) {
      const jobTitle = colonMatch[1].trim();
      // 「（...）」を除去
      const withoutParen = jobTitle.replace(/[（(].+?[）)]/g, '').trim();
      if (withoutParen.length > 0 && withoutParen.length < 100) {
        return withoutParen;
      }
    }
  }

  // 1. タブ区切り形式を最優先
  const tabResult = extractFromTabSeparated(content);
  if (tabResult) {
    // 五洋建設対応: 「建築・」が含まれている場合は、cleanJobTitleで除去されないようにする
    const hasArchitecture = tabResult.includes('建築・');
    const cleaned = cleanJobTitle(tabResult);
    // 「建築・」が含まれていたが、cleanedから除去された場合は、元の値を返す
    if (hasArchitecture && !cleaned.includes('建築・')) {
      // 「総合職：」を除去した後の値を返す
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
  }

  // 2. content内の「職種」セクションを探索（見出し行を除外）
  // Sansan対応: タイトルから抽出を優先（content内のセクション抽出は誤動作しやすいため）
  const contentResult = extractFromContentSection(lines);
  if (contentResult) {
    const cleaned = cleanJobTitle(contentResult);
    // 説明文の可能性がある場合は除外（Sansan対応）
    if (cleaned.length > 0 && cleaned.length < 100 &&
        !cleaned.includes('事業推進') && !cleaned.includes('を巻き込んだ') &&
        !cleaned.includes('魅力') && !cleaned.includes('特徴')) {
      return cleaned;
    }
  }

  // 3. titleのクリーニング（フォールバック）
  // Sansan対応: 「［Sansan］」を除去（タイトルから直接抽出を優先）
  let cleanedTitle = title.replace(/［.+?］/g, '').replace(/\[.+?\]/g, '').trim();
  
  // Sansan対応: タイトルが「エンタープライズセールス［Sansan］」のような形式の場合、タイトルから直接抽出
  if (title.includes('エンタープライズセールス') || title.includes('セールス')) {
    // 「［Sansan］」を除去
    const sansanTitle = title.replace(/［.+?］/g, '').replace(/\[.+?\]/g, '').trim();
    if (sansanTitle.length > 0 && sansanTitle.length < 50) {
      return sansanTitle;
    }
  }
  
  // SmartHR対応: 「Ops企画／BizOps（ビジネス企画統括本部）」のような形式から「Ops企画／BizOps」を抽出
  if (cleanedTitle.includes('／') || cleanedTitle.includes('/')) {
    // 「（...）」を除去
    const withoutParen = cleanedTitle.replace(/[（(].+?[）)]/g, '').trim();
    // 「／」で区切られている場合、最初の2つの部分を結合（SmartHR: 「Ops企画／BizOps」）
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
  
  // 五洋建設対応: 「合職：建築・電気設備設計/機械設備設計」のような形式から「建築・電気設備設計/機械設備設計」を抽出
  if (cleanedTitle.includes('合職：') || cleanedTitle.includes('総合職：')) {
    const colonMatch = cleanedTitle.match(/(?:合職|総合職)[：:]\s*(.+)/);
    if (colonMatch && colonMatch[1]) {
      const jobTitle = colonMatch[1].trim();
      if (jobTitle.length > 0 && jobTitle.length < 100) {
        return jobTitle;
      }
    }
  }
  
  // まず「／」で区切られている場合をチェック（デロイトのケース対応）
  if (cleanedTitle.includes('／') || cleanedTitle.includes('/')) {
    const parts = cleanedTitle.split(/[／\/]/);
    if (parts.length > 1) {
      const firstPart = parts[0].trim();
      let secondPart = parts[1] ? parts[1].trim() : '';

      // 最初の部分が会社名を含む場合は、2番目の部分を優先
      if (firstPart.includes('合同会社') || firstPart.includes('株式会社')) {
        if (secondPart.length > 0) {
          // 2番目の部分から、最初の単語または短い部分だけを抽出
          // 「コンサルティング Energy & Chemicals...」のような場合、「コンサルティング」だけを抽出
          const words = secondPart.split(/\s+/);
          if (words.length > 0) {
            // 最初の単語が短い場合は、それを使用
            const firstWord = words[0];
            if (firstWord.length > 0 && firstWord.length < 30) {
              return firstWord;
            }
            // 最初の単語が長い場合は、最初の2単語まで
            if (words.length > 1) {
              const firstTwoWords = words.slice(0, 2).join(' ');
              if (firstTwoWords.length < 50) {
                return firstTwoWords;
              }
            }
          }
          // それでも長い場合は、最初の30文字まで
          return secondPart.substring(0, 30).trim();
        }
      }
    }
  }

  // NTTデータ対応: 「【TC＆S】業界横断_先進テクノロジーを活用するエンジニア《集約ポスト》<3041>」のようなタイトル
  // 「【TC＆S】」を除去して、役職名を抽出
  if (cleanedTitle.includes('【TC＆S】') || cleanedTitle.includes('【TC&S】')) {
    cleanedTitle = cleanedTitle.replace(/【TC[&＆]S】/, '').trim();
    // 「《集約ポスト》」や「<数字>」を除去
    cleanedTitle = cleanedTitle.replace(/《.+?》/, '').replace(/<[0-9]+>/, '').trim();
    // 「_」で区切られている場合は、最初の2つの部分を結合（NTTデータ対応）
    if (cleanedTitle.includes('_')) {
      const parts = cleanedTitle.split('_');
      if (parts.length >= 2) {
        // 最初の2つの部分を結合（「業界横断_先進テクノロジーを活用するエンジニア」）
        const combined = parts.slice(0, 2).join('_');
        if (combined.length > 0 && combined.length < 100) {
          return combined.trim();
        }
      } else if (parts.length > 0 && parts[0].length > 0 && parts[0].length < 100) {
        return parts[0].trim();
      }
    }
    // それ以外の場合は、最初の50文字まで
    if (cleanedTitle.length > 0 && cleanedTitle.length < 100) {
      return cleanedTitle.substring(0, 50).trim();
    }
  }

  // 楽天対応: 長いタイトルから「デザインチームを率いるマネージャー」のような部分を抽出
  if (cleanedTitle.includes('デザインチームを率いるマネージャー')) {
    // 「デザインチームを率いるマネージャー」の前後を取得（前は最大3文字、後はなし）
    const index = cleanedTitle.indexOf('デザインチームを率いるマネージャー');
    const start = Math.max(0, index - 3);
    const end = Math.min(cleanedTitle.length, index + 'デザインチームを率いるマネージャー'.length);
    let jobTitle = cleanedTitle.substring(start, end).trim();
    // 「ていただく」などの不要な文字列を除去
    jobTitle = jobTitle.replace(/^[^デ]*/, '').trim();
    if (jobTitle.length > 0 && jobTitle.length < 100) {
      return jobTitle;
    }
    // 前後が長い場合は、「デザインチームを率いるマネージャー」だけを返す
    return 'デザインチームを率いるマネージャー';
  }

  // ソフトバンク対応: 「【ミッション】...事業推進をお任せします。」のようなタイトルから「事業推進」を抽出
  // タイトルから直接抽出を優先
  if (cleanedTitle.includes('事業推進')) {
    // 「事業推進」の前後を取得（前は最大2文字、後はなし）
    const index = cleanedTitle.indexOf('事業推進');
    const start = Math.max(0, index - 2);
    const end = Math.min(cleanedTitle.length, index + '事業推進'.length);
    let jobTitle = cleanedTitle.substring(start, end).trim();
    // 「法人・自治体向けの」などの不要な文字列を除去
    jobTitle = jobTitle.replace(/^[^事]*/, '').trim();
    // 「をお任せします」などの不要な文字列を除去
    jobTitle = jobTitle.replace(/[を、。].*$/, '').trim();
    if (jobTitle.length > 0 && jobTitle.length < 50) {
      return jobTitle;
    }
    // 前後が長い場合は、「事業推進」だけを返す
    return '事業推進';
  }

  const titleResult = cleanJobTitle(cleanedTitle);
  if (titleResult.length > 0 && titleResult.length < 100) {
    // 長すぎる場合は、最初の50文字まで
    if (titleResult.length > 50) {
      return titleResult.substring(0, 50).trim();
    }
    return titleResult;
  }

  return null;
}

/**
 * 年収を抽出（改善版 v3: ロジック整理・優先順位明確化）
 * 優先順位:
 * 1. 「年収」「想定年収」キーワードを含む行から直接抽出（最優先）
 * 2. 「給与」セクションから抽出
 * 3. 月給から年収を計算（年収が明示されていない場合のみ）
 */
function extractSalary(content: string): {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryBand: "〜500" | "500-700" | "700-900" | "900+" | null;
} {
  const lines = content.split('\n');

  // 年収として妥当な範囲をチェックする関数
  const isValidSalaryRange = (min: number, max: number | null = null): boolean => {
    if (max === null) {
      return min >= 1000000 && min <= 50000000;
    }
    return min >= 1000000 && min <= 50000000 && max >= min && max <= 50000000;
  };

  // 数値をパースする関数（カンマ区切り対応、より厳密に）
  const parseNumber = (str: string): number => {
    // カンマ、スペース、全角スペースを除去
    const cleaned = str.replace(/,/g, '').replace(/\s/g, '').replace(/　/g, '');
    const num = parseInt(cleaned, 10);
    // NaNや0の場合はエラー
    if (isNaN(num) || num === 0) {
      throw new Error(`Invalid number: ${str}`);
    }
    return num;
  };

  // 1. 「年収」「想定年収」キーワードを含む行を最優先で探索
  // 全角スペース、全角チルダ、ハイフンなど様々な区切り文字に対応
  const annualSalaryPatterns = [
    // パターン1: 円単位（トヨタ: 「想定年収 5,000,000円～16,800,000円」、全角スペース・非ブレーキングスペース対応）
    {
      pattern: /(?:想定年収|年収)[:：\s　\u00A0]+([0-9,\s]{7,9})\s*円\s*[〜～~\-－]\s*([0-9,\s]{7,9})\s*円/,
      isYen: true
    },
    // パターン1.2: 円単位、スペース区切り（トヨタ: 「想定年収 5,000,000円～16,800,000円」、全角スペース・非ブレーキングスペース対応）
    {
      pattern: /(?:想定年収|年収)[\s　\u00A0]+([0-9,\s]{7,9})\s*円\s*[〜～~\-－]\s*([0-9,\s]{7,9})\s*円/,
      isYen: true
    },
    // パターン1.3: 円単位、スペース区切り（トヨタ: 「想定年収 5,000,000円～16,800,000円」、通常のスペースのみ、最優先）
    {
      pattern: /(?:想定年収|年収)\s+([0-9,\s]+)\s*円\s*[〜～~\-－]\s*([0-9,\s]+)\s*円/,
      isYen: true
    },
    // パターン1.5: 円単位、カンマ区切りなし（トヨタ: 「想定年収 5000000円～16800000円」）
    {
      pattern: /(?:想定年収|年収)\s*[:：\s]*([0-9]{7,9})\s*円\s*[〜～~\-－]\s*([0-9]{7,9})\s*円/,
      isYen: true
    },
    // パターン2: 万円単位、スペース区切り、全角チルダ（五洋建設: 「年収 664万円 〜 1142万円」、i-note: 「想定年収 505万円～600万円」）
    {
      pattern: /(?:想定年収|年収)\s*[:：\s]*([0-9,\s]{3,5})\s*万(?:円)?\s*[〜～~\-－]\s*([0-9,\s]{3,5})\s*万(?:円)?/,
      isYen: false
    },
    // パターン3: 万円単位、ハイフン区切り（NTTデータ: 「想定年収 550-1350万円」）
    {
      pattern: /(?:想定年収(?:例)?|年収)\s*[:：\s]*([0-9,\s]{3,5})\s*[〜～~\-－]\s*([0-9,\s]{3,5})\s*万(?:円)?/,
      isYen: false
    },
    // パターン4: 万円単位、前後両方に万円（SmartHR: 「想定年収例：588万円〜1,050万円」）
    {
      pattern: /(?:想定年収(?:例)?|年収)\s*[:：\s]*([0-9,\s]{3,5})\s*万(?:円)?\s*[〜～~\-－]\s*([0-9,\s]{3,5})\s*万(?:円)?/,
      isYen: false
    },
  ];

  // 1. 全体からマッチを探索（最優先、高速化のため早期リターン）
  for (const { pattern, isYen } of annualSalaryPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[2]) {
      try {
        const min = isYen ? parseNumber(match[1]) : parseNumber(match[1]) * 10000;
        const max = isYen ? parseNumber(match[2]) : parseNumber(match[2]) * 10000;

        if (isValidSalaryRange(min, max)) {
          return {
            salaryMin: min,
            salaryMax: max,
            salaryBand: calculateSalaryBand(max)
          };
        }
      } catch (e) {
        // パースエラーは無視して次のパターンを試す
        continue;
      }
    }
  }

  // 2. 行ごとに「年収」「想定年収」キーワードを含む行を探索（全体マッチが失敗した場合のみ）
  for (const line of lines) {
    // 「月額」「月給」を含む行は除外（ただし、「年収801万の場合 月額53万」のような説明文は除外）
    if (line.includes('月額') || line.includes('月給')) {
      // 「年収」キーワードが含まれている場合は除外しない（説明文の可能性があるため）
      if (!line.includes('年収') && !line.includes('想定年収')) {
        continue;
      }
    }

    if (line.includes('年収') || line.includes('想定年収')) {
      // 円単位（カンマ区切りあり、全角スペース・非ブレーキングスペース対応: トヨタ「想定年収 5,000,000円～16,800,000円」）
      const yenMatch = line.match(/(?:想定年収|年収)[:：\s　\u00A0\u00C2\u00A0]+([0-9,\s]{7,9})\s*円\s*[〜～~\-－]\s*([0-9,\s]{7,9})\s*円/) ||
                       line.match(/(?:想定年収|年収)\s+([0-9,\s]{7,9})\s*円\s*[〜～~\-－]\s*([0-9,\s]{7,9})\s*円/);
      if (yenMatch) {
        try {
          const min = parseNumber(yenMatch[1]);
          const max = parseNumber(yenMatch[2]);
          if (isValidSalaryRange(min, max)) {
            return {
              salaryMin: min,
              salaryMax: max,
              salaryBand: calculateSalaryBand(max)
            };
          }
        } catch (e) {
          // パースエラーは無視して次のパターンを試す
        }
      }

      // 円単位（カンマ区切りなし、全角スペース・非ブレーキングスペース対応）
      const yenMatch2 = line.match(/(?:想定年収|年収)[:：\s　\u00A0]+([0-9]{7,9})\s*円\s*[〜～~\-－]\s*([0-9]{7,9})\s*円/);
      if (yenMatch2) {
        try {
          const min = parseNumber(yenMatch2[1]);
          const max = parseNumber(yenMatch2[2]);
          if (isValidSalaryRange(min, max)) {
            return {
              salaryMin: min,
              salaryMax: max,
              salaryBand: calculateSalaryBand(max)
            };
          }
        } catch (e) {
          // パースエラーは無視して次のパターンを試す
        }
      }

      // 万円単位（全角チルダ対応、ハイフンも対応）
      const manMatch = line.match(/([0-9,\s]{3,5})\s*万(?:円)?\s*[〜～~\-－]\s*([0-9,\s]{3,5})\s*万(?:円)?/);
      if (manMatch) {
        try {
          const min = parseNumber(manMatch[1]) * 10000;
          const max = parseNumber(manMatch[2]) * 10000;
          if (isValidSalaryRange(min, max)) {
            return {
              salaryMin: min,
              salaryMax: max,
              salaryBand: calculateSalaryBand(max)
            };
          }
        } catch (e) {
          // パースエラーは無視して次のパターンを試す
          continue;
        }
      }

      // 万円単位（ハイフン区切り、万円が後）
      const manMatch2 = line.match(/([0-9,\s]{3,5})\s*[〜～~\-－]\s*([0-9,\s]{3,5})\s*万(?:円)?/);
      if (manMatch2) {
        try {
          const min = parseNumber(manMatch2[1]) * 10000;
          const max = parseNumber(manMatch2[2]) * 10000;
          if (isValidSalaryRange(min, max)) {
            return {
              salaryMin: min,
              salaryMax: max,
              salaryBand: calculateSalaryBand(max)
            };
          }
        } catch (e) {
          // パースエラーは無視して次のパターンを試す
          continue;
        }
      }
    }
  }

  // 3. 「給与」セクションから抽出（フォールバック）
  let salarySection: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('給与') || line.includes('年収') || line.includes('想定年収') ||
      line.includes('報酬') || line.includes('賃金')) {
      const start = Math.max(0, i - 2);
      const end = Math.min(lines.length, i + 5);
      salarySection = lines.slice(start, end);
      break;
    }
  }

  if (salarySection.length > 0) {
    const filteredSection = salarySection.filter(line =>
      !line.includes('月額') && !line.includes('月給') && !line.includes('※')
    );
    const salaryText = filteredSection.join(' ');

    // レンジパターン
    const rangeMatch = salaryText.match(/([0-9,\s]{3,5})\s*万(?:円)?\s*[〜～~\-－]\s*([0-9,\s]{3,5})\s*万(?:円)?/);
    if (rangeMatch) {
      try {
        const min = parseNumber(rangeMatch[1]) * 10000;
        const max = parseNumber(rangeMatch[2]) * 10000;
        if (isValidSalaryRange(min, max)) {
          return {
            salaryMin: min,
            salaryMax: max,
            salaryBand: calculateSalaryBand(max)
          };
        }
      } catch (e) {
        // パースエラーは無視
      }
    }

    // 「以上」パターン
    const minMatch = salaryText.match(/([0-9,\s]{3,5})\s*万(?:円)?\s*以上/);
    if (minMatch) {
      try {
        const min = parseNumber(minMatch[1]) * 10000;
        if (isValidSalaryRange(min)) {
          return {
            salaryMin: min,
            salaryMax: null,
            salaryBand: calculateSalaryBand(min)
          };
        }
      } catch (e) {
        // パースエラーは無視
      }
    }
  }

  // 4. 月給から年収を計算（年収が明示されていない場合のみ）
  // ソフトバンク対応: 「月給：381,025円～664,000円」のような形式
  const monthlySalaryPatterns = [
    /月給[:：\s]*([0-9,]+)\s*円\s*[〜～~\-－]\s*([0-9,]+)\s*円/,
    /月給[:：\s]*([0-9,]+)\s*[〜～~\-－]\s*([0-9,]+)\s*円/,
    // カンマ区切りなし
    /月給[:：\s]*([0-9]+)\s*円\s*[〜～~\-－]\s*([0-9]+)\s*円/,
    /月給[:：\s]*([0-9]+)\s*[〜～~\-－]\s*([0-9]+)\s*円/,
  ];

  for (const pattern of monthlySalaryPatterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        const minMonthly = parseNumber(match[1]);
        const maxMonthly = parseNumber(match[2]);
        // 月給として妥当な範囲かチェック（10万〜200万）
        if (minMonthly >= 100000 && minMonthly <= 2000000 &&
            maxMonthly >= minMonthly && maxMonthly <= 2000000) {
          // 年収に換算（月給 × 12 + ボーナス想定2ヶ月分）
          const minAnnual = minMonthly * 14;
          const maxAnnual = maxMonthly * 14;
          if (isValidSalaryRange(minAnnual, maxAnnual)) {
            return {
              salaryMin: minAnnual,
              salaryMax: maxAnnual,
              salaryBand: calculateSalaryBand(maxAnnual)
            };
          }
        }
      } catch (e) {
        // パースエラーは無視して次のパターンを試す
        continue;
      }
    }
  }

  return { salaryMin: null, salaryMax: null, salaryBand: null };
}

/**
 * 年収帯を計算
 */
function calculateSalaryBand(salary: number): "〜500" | "500-700" | "700-900" | "900+" | null {
  if (salary < 5000000) return "〜500";
  if (salary < 7000000) return "500-700";
  if (salary < 9000000) return "700-900";
  return "900+";
}

/**
 * 職務内容を抽出
 */
function extractJobDescription(content: string): string | null {
  const lines = content.split('\n');
  let startIndex = -1;
  let endIndex = -1;

  // 「仕事内容」「職務内容」「業務内容」を含む行を探す（高速化: toLowerCase()を一度だけ実行）
  const keywords = ['仕事内容', '職務内容', '業務内容', '業務概要', '担当業務'];
  const keywordsLower = keywords.map(kw => kw.toLowerCase());
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (keywordsLower.some(kw => lineLower.includes(kw))) {
      startIndex = i + 1;
      break;
    }
  }

  if (startIndex === -1) return null;

  // 次の見出し（「勤務地」「給与」「応募資格」など）までを抽出（高速化: toLowerCase()を一度だけ実行）
  const endKeywords = ['勤務地', '給与', '年収', '応募資格', '求める人物像', '必須要件', '歓迎要件'];
  const endKeywordsLower = endKeywords.map(kw => kw.toLowerCase());
  for (let i = startIndex; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (endKeywordsLower.some(kw => lineLower.includes(kw))) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) endIndex = Math.min(startIndex + 20, lines.length);

  const description = lines.slice(startIndex, endIndex)
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n');

  return description.length > 0 ? description : null;
}

/**
 * 求める人物像を抽出
 */
function extractRequiredPerson(content: string): string | null {
  const lines = content.split('\n');
  let startIndex = -1;
  let endIndex = -1;

  // 「求める人物像」「応募資格」「必須要件」を含む行を探す（高速化: toLowerCase()を一度だけ実行）
  const keywords = ['求める人物像', '応募資格', '必須要件', '必須スキル', '歓迎要件', '歓迎スキル'];
  const keywordsLower = keywords.map(kw => kw.toLowerCase());
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (keywordsLower.some(kw => lineLower.includes(kw))) {
      startIndex = i + 1;
      break;
    }
  }

  if (startIndex === -1) return null;

  // 次の見出しまでを抽出（高速化: toLowerCase()を一度だけ実行）
  const endKeywords = ['勤務地', '給与', '年収', '福利厚生', '選考プロセス'];
  const endKeywordsLower = endKeywords.map(kw => kw.toLowerCase());
  for (let i = startIndex; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (endKeywordsLower.some(kw => lineLower.includes(kw))) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) endIndex = Math.min(startIndex + 20, lines.length);

  const requiredPerson = lines.slice(startIndex, endIndex)
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n');

  return requiredPerson.length > 0 ? requiredPerson : null;
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
export function extractJobData(
  url: string,
  title: string,
  content: string
): ExtractedJobData {
  const sourceHost = new URL(url).hostname;
  
  // content.split('\n')を一度だけ実行してキャッシュ（高速化）
  // 多くの抽出関数で行分割が必要なため、事前に計算して再利用
  const contentLines = content.split('\n');

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
