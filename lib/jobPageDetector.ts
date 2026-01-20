/**
 * 求人ページ判定ロジック
 * URL、タイトル、本文から求人ページかどうかを判定
 */

export interface JobPageDetectionResult {
  score: number;
  pageType: 'job_detail' | 'job_list' | 'non_job';
  reasons: string[];
}

/**
 * 求人ページのスコアを計算
 * @param url ページURL
 * @param title ページタイトル
 * @param content ページ本文
 * @returns 判定結果（スコア、ページタイプ、理由）
 */
export function calculateJobPageScore(
  url: string,
  title: string,
  content: string
): JobPageDetectionResult {
  let score = 0;
  const reasons: string[] = [];

  // URL判定（0-30点）
  if (/\/job\//i.test(url)) {
    score += 30;
    reasons.push('URLに"/job/"が含まれる');
  } else if (/\/career\//i.test(url)) {
    score += 25;
    reasons.push('URLに"/career/"が含まれる');
  } else if (/\/recruit\//i.test(url)) {
    score += 25;
    reasons.push('URLに"/recruit/"が含まれる');
  } else if (/\/detail\//i.test(url)) {
    score += 20;
    reasons.push('URLに"/detail/"が含まれる');
  }

  // タイトル判定（0-30点）
  const titleKeywords = ['求人', '採用', '募集', 'job', 'career', 'recruit'];
  const matchedTitleKeyword = titleKeywords.find(k => title.includes(k));
  if (matchedTitleKeyword) {
    score += 30;
    reasons.push(`タイトルに"${matchedTitleKeyword}"が含まれる`);
  }

  // 本文判定（0-40点）
  const contentKeywords = ['年収', '給与', '勤務地', '応募', '資格', '経験'];
  const matchedContentKeywords = contentKeywords.filter(k => content.includes(k));
  score += matchedContentKeywords.length * 5;
  if (matchedContentKeywords.length > 0) {
    reasons.push(`本文に求人関連キーワードが${matchedContentKeywords.length}個含まれる`);
  }

  // 一覧ページの除外（-50点）
  if (/一覧|list|search|検索結果/i.test(url) || /一覧|list|search|検索結果/i.test(title)) {
    score -= 50;
    reasons.push('一覧ページの可能性が高い');
  }

  // 非求人ページの除外（-50点）
  const nonJobPatterns = [
    /\/company\//i, /\/ir\//i, /\/about\//i, /\/contact\//i,
    /\/privacy\//i, /\/terms\//i, /\/login\//i, /\/signup\//i
  ];
  if (nonJobPatterns.some(pattern => pattern.test(url))) {
    score -= 50;
    reasons.push('非求人ページの可能性が高い');
  }

  // ページタイプを判定
  const pageType = score >= 30 ? 'job_detail' :
    score >= 0 ? 'job_list' : 'non_job';

  return { score, pageType, reasons };
}
