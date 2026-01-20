/**
 * 安全なログ出力（個人情報マスキング）
 */

/**
 * URLをマスキング
 * @param url 元のURL
 * @returns マスキングされたURL
 */
function maskUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}/***`;
  } catch {
    return '***';
  }
}

/**
 * 安全なログ出力（個人情報をマスキング）
 * @param message ログメッセージ
 * @param data ログデータ
 */
export function safeLog(message: string, data: any) {
  const masked = {
    ...data,
    content: data.content ? `${data.content.substring(0, 100)}...` : null,
    url: data.url ? maskUrl(data.url) : data.url,
  };
  console.log(message, masked);
}
