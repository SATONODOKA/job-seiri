
/**
 * 勤務地・リモートワーク情報の抽出ロジック
 */

export interface LocationData {
    locationText: string | null;
    remoteType: "onsite" | "hybrid" | "remote" | "unknown";
}

/**
 * 勤務地情報を抽出する
 */
export function extractLocation(content: string): LocationData {
    const lines = content.split('\n');
    let locationText: string | null = null;
    let remoteType: LocationData['remoteType'] = 'unknown';

    // 1. 勤務地テキストの抽出
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // "勤務地"、"就業場所" などのキーワードを探す
        if (/^(勤務地|就業場所|場所|Branch|Location)[:：\s\t]*/.test(line)) {
            // 見出し行の場合（値がこの行にない、または短い）
            const value = line.replace(/^(勤務地|就業場所|場所|Branch|Location)[:：\s\t]*/, '').trim();

            // 値がない、または「location-」で始まる（アイコンクラス名等のノイズ）場合は次の行へ
            if (value.length === 0 || value.startsWith('location-')) {
                // 次の行をチェック
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine.length > 0 && nextLine.length < 100 && !nextLine.startsWith('location-')) {
                        locationText = nextLine;
                        break;
                    }
                }
            } else {
                // 同じ行に値がある場合
                if (value.length > 0 && value.length < 100) {
                    locationText = value;
                    break;
                }
            }
        }
    }

    // 2. リモートワークタイプの判定
    // content全体またはlocationTextから判定
    const textToCheck = (locationText || "") + " " + content.substring(0, 5000); // パフォーマンスのため先頭5000文字など

    if (/フルリモート|完全在宅|完全リモート|Full Remote/i.test(textToCheck)) {
        remoteType = 'remote';
    } else if (/ハイブリッド|週\d+回出社|月\d+回出社|Hybrid/i.test(textToCheck)) {
        remoteType = 'hybrid';
    } else if (/原則出社|原則オフィス|On-site|Onsite/i.test(textToCheck)) {
        remoteType = 'onsite';
    } else if (locationText && (/リモート|在宅/.test(locationText) || /相談可/.test(locationText))) {
        // 勤務地テキストにリモート/在宅/相談可が含まれる場合
        remoteType = 'hybrid'; // 推測
    }

    return {
        locationText,
        remoteType
    };
}
