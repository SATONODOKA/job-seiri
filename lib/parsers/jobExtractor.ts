/**
 * 求人情報抽出ロジック（ルールベース）
 * reference/job_seiri_data_design_v1.md を参考に実装
 */

export interface ExtractedJobData {
  companyName: string | null;
  jobTitle: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryBand: "〜500" | "500-700" | "700-900" | "900+" | null;
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

        // Sansan対応: 「XXX株式会社の営業とは」のような説明文の見出しを除外
        // 「XXX株式会社とは」「XXX株式会社について」などのパターンも除外
        const descriptionSuffixPattern = /(の[^、。]+とは|とは|について|に関する|では|が|の特徴|の強み|の魅力)$/;
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
            '顧客', 'お客様', 'サービス', '提供', '実現', 'リード', '未来', '価値', 'ミッション'
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
  
  // 【部署名】を除去（最初の【】のみ）
  cleaned = cleaned.replace(/^【.+?】/, '').trim();
  
  // [会社名]を除去
  cleaned = cleaned.replace(/^\[.+?\]/, '').trim();
  
  // 「|」で区切られた部分を除去（後ろの部分）
  cleaned = cleaned.replace(/\s*[|｜]\s*.+$/, '').trim();
  
  // 「_」で区切られた部分を除去（場所情報など）
  cleaned = cleaned.replace(/_\s*.+$/, '').trim();
  
  // 末尾の「（場所）」を除去
  cleaned = cleaned.replace(/\([^)]*\)$/, '').trim();
  
  // 「募集」を除去
  cleaned = cleaned.replace(/募集$/, '').trim();
  
  // 先頭の「|」より前を除去
  cleaned = cleaned.replace(/^.+?[\s|｜｜]/, '').trim();
  
  // 【】で囲まれた部分を除去（残っている場合）
  cleaned = cleaned.replace(/【.+?】/g, '').trim();
  
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
    /^職務内容\s*$/
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
    
    // 見出し行パターンに一致しない場合
    if (!isHeadingLine(line)) {
      // 長すぎる場合は除外（説明文の可能性）
      if (line.length > 0 && line.length < 100) {
        // 見出し行と同じキーワードを含む場合は除外
        if (!line.includes('職種') && !line.includes('募集') && 
            !line.includes('業務内容') && !line.includes('職務内容')) {
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
  // タブ区切りの形式: 「職種 / 募集ポジション\t【役職名】」
  const tabSeparatedPattern = /職種\s*[\/／]?\s*募集ポジション?\s*\t(.+)/;
  const tabMatch = content.match(tabSeparatedPattern);
  if (tabMatch && tabMatch[1]) {
    let jobTitle = tabMatch[1].trim();
    
    // 【】で囲まれた部分を抽出（優先）
    const bracketMatch = jobTitle.match(/【(.+?)】/);
    if (bracketMatch && bracketMatch[1]) {
      jobTitle = bracketMatch[1];
    }
    
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
    
    // 「職種」「募集職種」「ポジション」を含む行を探す
    if (line.includes('募集職種') || line.includes('職種') || line.includes('ポジション')) {
      // 見出し行の場合は、次の行を取得
      if (isHeadingLine(line)) {
        const nextLine = findNextNonHeadingLine(lines, i);
        if (nextLine) {
          return nextLine;
        }
      } else {
        // 見出し行でない場合は、コロンやタブの後の値を抽出
        const colonMatch = line.match(/[:：\s\t]+(.+)/);
        if (colonMatch && colonMatch[1]) {
          const jobTitle = colonMatch[1].trim();
          if (jobTitle.length > 0 && jobTitle.length < 100 && 
              !jobTitle.includes('Energy & Chemicals') && 
              !jobTitle.includes('Mining & Metals')) {
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
  
  // 1. タブ区切り形式を最優先
  const tabResult = extractFromTabSeparated(content);
  if (tabResult) {
    const cleaned = cleanJobTitle(tabResult);
    if (cleaned.length > 0 && cleaned.length < 100) {
      return cleaned;
    }
  }
  
  // 2. content内の「職種」セクションを探索（見出し行を除外）
  const contentResult = extractFromContentSection(lines);
  if (contentResult) {
    const cleaned = cleanJobTitle(contentResult);
    if (cleaned.length > 0 && cleaned.length < 100) {
      return cleaned;
    }
  }
  
  // 3. titleのクリーニング（フォールバック）
  // まず「／」で区切られている場合をチェック（デロイトのケース対応）
  if (title.includes('／') || title.includes('/')) {
    const parts = title.split(/[／\/]/);
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
  
  const titleResult = cleanJobTitle(title);
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
 * 年収を抽出（改善版 v2: SmartHR・Sansan対応）
 * 問題: 月額の数値を誤って年収として抽出していた
 * 解決: 「年収」「想定年収」キーワードを含む行を最優先で探索
 */
function extractSalary(content: string): {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryBand: "〜500" | "500-700" | "700-900" | "900+" | null;
} {
  const lines = content.split('\n');

  // 1. 「年収」「想定年収」キーワードを含む行を最優先で探索
  // SmartHR: 「想定年収例：588万円〜1,050万円」
  // Sansan: 「年収801万円～1,506万円」
  const annualSalaryPatterns = [
    /想定年収(?:例)?[:：\s]*([0-9,]{3,5})\s*万(?:円)?\s*[〜～~-]\s*([0-9,]{3,5})\s*万(?:円)?/,
    /年収[:：\s]*([0-9,]{3,5})\s*万(?:円)?\s*[〜～~-]\s*([0-9,]{3,5})\s*万(?:円)?/,
    /年収([0-9,]{3,5})\s*万(?:円)?\s*[〜～~-]\s*([0-9,]{3,5})\s*万(?:円)?/,
  ];

  for (const pattern of annualSalaryPatterns) {
    const match = content.match(pattern);
    if (match) {
      const min = parseInt(match[1].replace(/,/g, ''), 10) * 10000;
      const max = parseInt(match[2].replace(/,/g, ''), 10) * 10000;
      // 年収として妥当な範囲かチェック（100万〜5000万）
      if (min >= 1000000 && min <= 50000000 && max >= min && max <= 50000000) {
        return {
          salaryMin: min,
          salaryMax: max,
          salaryBand: calculateSalaryBand(max)
        };
      }
    }
  }

  // 2. 行ごとに「年収」キーワードを含む行を探索（より柔軟なパターン）
  for (const line of lines) {
    // 「月額」「月給」を含む行は除外（月額の数値を誤って抽出しない）
    if (line.includes('月額') || line.includes('月給')) {
      continue;
    }

    // 「年収」「想定年収」を含む行のみ対象
    if (line.includes('年収') || line.includes('想定年収')) {
      const rangeMatch = line.match(/([0-9,]{3,5})\s*万(?:円)?\s*[〜～~-]\s*([0-9,]{3,5})\s*万(?:円)?/);
      if (rangeMatch) {
        const min = parseInt(rangeMatch[1].replace(/,/g, ''), 10) * 10000;
        const max = parseInt(rangeMatch[2].replace(/,/g, ''), 10) * 10000;
        // 年収として妥当な範囲かチェック
        if (min >= 1000000 && min <= 50000000 && max >= min && max <= 50000000) {
          return {
            salaryMin: min,
            salaryMax: max,
            salaryBand: calculateSalaryBand(max)
          };
        }
      }
    }
  }

  // 3. 「応相談」の後に年収情報があるパターン
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('応相談')) {
      // 次の数行を探索
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        // 月額を含む行は除外
        if (lines[j].includes('月額') || lines[j].includes('月給')) {
          continue;
        }
        const salaryMatch = lines[j].match(/([0-9,]{3,5})\s*万(?:円)?\s*[〜～~-]\s*([0-9,]{3,5})\s*万(?:円)?/);
        if (salaryMatch) {
          const min = parseInt(salaryMatch[1].replace(/,/g, ''), 10) * 10000;
          const max = parseInt(salaryMatch[2].replace(/,/g, ''), 10) * 10000;
          // 年収として妥当な範囲かチェック
          if (min >= 1000000 && min <= 50000000 && max >= min && max <= 50000000) {
            return {
              salaryMin: min,
              salaryMax: max,
              salaryBand: calculateSalaryBand(max)
            };
          }
        }
      }
    }
  }

  // 4. 「給与」セクション探索ロジック（フォールバック）
  let salarySection: string[] = [];

  // 「給与」「年収」「想定年収」を含む行の前後±4行をセクション候補
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('給与') || line.includes('年収') || line.includes('想定年収') ||
        line.includes('報酬') || line.includes('賃金')) {
      const start = Math.max(0, i - 4);
      const end = Math.min(lines.length, i + 5);
      salarySection = lines.slice(start, end);
      break;
    }
  }

  if (salarySection.length === 0) {
    return { salaryMin: null, salaryMax: null, salaryBand: null };
  }

  // 月額・月給を含む行を除外してから処理
  const filteredSection = salarySection.filter(line =>
    !line.includes('月額') && !line.includes('月給') && !line.includes('※')
  );
  const salaryText = filteredSection.join(' ');

  // レンジパターン: 400万〜600万、500万円以上など
  const rangePattern = /([0-9,]{3,5})\s*万(?:円)?\s*[〜～~-]\s*([0-9,]{3,5})\s*万(?:円)?/;
  const rangeMatch = salaryText.match(rangePattern);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1].replace(/,/g, ''), 10) * 10000;
    const max = parseInt(rangeMatch[2].replace(/,/g, ''), 10) * 10000;
    // 年収として妥当な範囲かチェック
    if (min >= 1000000 && min <= 50000000 && max >= min && max <= 50000000) {
      return {
        salaryMin: min,
        salaryMax: max,
        salaryBand: calculateSalaryBand(max)
      };
    }
  }

  // 「以上」パターン: 500万円以上
  const minPattern = /([0-9,]{3,5})\s*万(?:円)?\s*以上/;
  const minMatch = salaryText.match(minPattern);
  if (minMatch) {
    const min = parseInt(minMatch[1].replace(/,/g, ''), 10) * 10000;
    // 年収として妥当な範囲かチェック
    if (min >= 1000000 && min <= 50000000) {
      return {
        salaryMin: min,
        salaryMax: null,
        salaryBand: calculateSalaryBand(min)
      };
    }
  }

  // 5. 年収の単一値を抽出（年収キーワードを含む行のみ）
  for (const line of filteredSection) {
    if (line.includes('年収') || line.includes('想定年収')) {
      const singleMatch = line.match(/([0-9,]{3,5})\s*万(?:円)?/);
      if (singleMatch) {
        const value = parseInt(singleMatch[1].replace(/,/g, ''), 10) * 10000;
        // 年収として妥当な範囲かチェック
        if (value >= 1000000 && value <= 50000000) {
          return {
            salaryMin: value,
            salaryMax: null,
            salaryBand: calculateSalaryBand(value)
          };
        }
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

  // 「仕事内容」「職務内容」「業務内容」を含む行を探す
  const keywords = ['仕事内容', '職務内容', '業務内容', '業務概要', '担当業務'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (keywords.some(kw => line.includes(kw.toLowerCase()))) {
      startIndex = i + 1;
      break;
    }
  }

  if (startIndex === -1) return null;

  // 次の見出し（「勤務地」「給与」「応募資格」など）までを抽出
  const endKeywords = ['勤務地', '給与', '年収', '応募資格', '求める人物像', '必須要件', '歓迎要件'];
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (endKeywords.some(kw => line.includes(kw.toLowerCase()))) {
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

  // 「求める人物像」「応募資格」「必須要件」を含む行を探す
  const keywords = ['求める人物像', '応募資格', '必須要件', '必須スキル', '歓迎要件', '歓迎スキル'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (keywords.some(kw => line.includes(kw.toLowerCase()))) {
      startIndex = i + 1;
      break;
    }
  }

  if (startIndex === -1) return null;

  // 次の見出しまでを抽出
  const endKeywords = ['勤務地', '給与', '年収', '福利厚生', '選考プロセス'];
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (endKeywords.some(kw => line.includes(kw.toLowerCase()))) {
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
 * 職種タグを抽出（改善版）
 */
function extractJobType(title: string, content: string): string | null {
  const searchText = (title + ' ' + content).toLowerCase();
  const titleLower = title.toLowerCase();

  // 職種辞書（優先順位順、より具体的なものを優先）
  const jobTypePatterns = [
    { pattern: /データアナリスト|アナリスト/i, tag: 'データアナリスト', priority: 1 },
    { pattern: /プロダクトデザイナー|ui\/uxデザイナー|uiuxデザイナー/i, tag: 'デザイナー', priority: 1 },
    { pattern: /プロダクトマネージャー|pdm|プロダクトオーナー|po/i, tag: 'PdM', priority: 2 },
    { pattern: /プロジェクトマネージャー|pm|pjm/i, tag: 'PM', priority: 2 },
    { pattern: /カスタマーサクセス|csm|オンボーディング/i, tag: 'CS', priority: 1 },
    { pattern: /コンサルタント|コンサル/i, tag: 'コンサル', priority: 1 },
    { pattern: /マーケティング|グロース|デジタルマーケティング/i, tag: 'マーケ', priority: 2 },
    { pattern: /法人営業|フィールドセールス|インサイドセールス|アカウントエグゼクティブ/i, tag: '営業', priority: 2 }
  ];

  // title内のキーワードを優先
  for (const { pattern, tag } of jobTypePatterns) {
    if (pattern.test(titleLower)) {
      return tag;
    }
  }

  // content内のキーワード（優先度が高いものから）
  const sortedPatterns = jobTypePatterns.sort((a, b) => a.priority - b.priority);
  for (const { pattern, tag } of sortedPatterns) {
    if (pattern.test(searchText)) {
      return tag;
    }
  }

  return null;
}

/**
 * 業種タグを抽出（改善版）
 */
function extractIndustry(sourceHost: string, content: string): string | null {
  const searchText = (sourceHost + ' ' + content).toLowerCase();

  // 業種辞書（拡充版）
  const industryPatterns = [
    { pattern: /saas|クラウドサービス|サブスクリプション|b2b saas/i, tag: 'SaaS' },
    { pattern: /人材紹介|採用支援|タレントマネジメント|hrテック|適性検査/i, tag: 'HR' },
    { pattern: /キャッシュレス|決済|フィンテック|金融サービス/i, tag: 'Fintech' },
    { pattern: /戦略コンサルティング|マネジメントコンサルティング|big4|コンサルティング|コンサル/i, tag: 'Consulting' },
    { pattern: /si|システムインテグレーション|インフラ構築|ネットワーク/i, tag: 'SIer/Infra' }
  ];

  for (const { pattern, tag } of industryPatterns) {
    if (pattern.test(searchText)) {
      return tag;
    }
  }

  return null;
}

/**
 * メイン抽出関数
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
    industry: extractIndustry(sourceHost, content)
  };
}
