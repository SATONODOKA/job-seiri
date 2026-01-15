
/**
 * 経験年数・シニアリティレベル抽出ロジック
 */

export interface ExperienceData {
    requiredYears: number | null;
    seniorityLevel: "junior" | "mid" | "senior" | "manager" | null;
}

export function extractExperience(content: string, title: string): ExperienceData {
    let requiredYears: number | null = null;
    let seniorityLevel: ExperienceData['seniorityLevel'] = null;

    const contentLower = content.toLowerCase();
    const titleLower = title.toLowerCase();

    // 1. 経験年数の抽出
    // 「必須要件」などのセクション内を探すのが理想だが、ここでは簡易的に検索
    const yearsMatch = content.match(/(\d+)年以上の(?:実務)?経験/);
    if (yearsMatch && yearsMatch[1]) {
        requiredYears = parseInt(yearsMatch[1], 10);
    } else {
        // 英語パターン
        const yearsMatchEn = content.match(/(\d+)\+?\s*years/i);
        if (yearsMatchEn && yearsMatchEn[1]) {
            requiredYears = parseInt(yearsMatchEn[1], 10);
        }
    }

    // 2. シニアリティレベルの判定
    // タイトルを優先
    if (/manager|マネージャー|管理職|部長|課長|リード|lead|head of|vp/i.test(titleLower)) {
        seniorityLevel = "manager";
    } else if (/senior|シニア/i.test(titleLower)) {
        seniorityLevel = "senior";
    } else if (/junior|ジュニア|若手|第二新卒|未経験/i.test(titleLower)) {
        seniorityLevel = "junior";
    }

    // contentから判定 (タイトルで決まらなかった場合)
    if (!seniorityLevel) {
        if (requiredYears !== null) {
            if (requiredYears >= 7) seniorityLevel = "senior";
            else if (requiredYears >= 3) seniorityLevel = "mid";
            else seniorityLevel = "junior";
        }

        if (!seniorityLevel) {
            if (/マネージャー|管理職/i.test(contentLower)) {
                // content内のマネージャーは「マネージャー候補」や「マネージャーへの報告」など文脈によるので慎重に
                // ここでは判定しない、またはスコア付けが必要
            }

            if (/未経験可|未経験歓迎|第二新卒歓迎/.test(content)) {
                seniorityLevel = "junior";
            }
        }
    }

    return {
        requiredYears,
        seniorityLevel
    };
}
