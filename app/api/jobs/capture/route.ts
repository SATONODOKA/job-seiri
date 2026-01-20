import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { extractWithGemini } from "@/lib/llm/providers/gemini";
import { checkRateLimit } from "@/lib/rateLimit";
import { calculateJobPageScore } from "@/lib/jobPageDetector";
import { safeLog } from "@/lib/safeLog";

export async function OPTIONS() {
    // CORS制限（拡張機能IDを環境変数で指定）
    const EXTENSION_ID = process.env.EXTENSION_ID;
    const allowedOrigin = EXTENSION_ID
        ? `chrome-extension://${EXTENSION_ID}`
        : '*'; // 開発環境のみ

    return new NextResponse(null, {
        headers: {
            "Access-Control-Allow-Origin": allowedOrigin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}

/**
 * 簡易トークン検証（本番ではFirebase Admin SDK推奨）
 */
function verifyToken(token: string | null): string | null {
    if (!token) return null;
    
    // 簡易トークン検証（トークン形式: "user_{userId}_{timestamp}_{hash}"）
    try {
        const parts = token.split('_');
        if (parts.length !== 4 || parts[0] !== 'user') return null;
        const userId = parts[1];
        // タイムスタンプとハッシュの検証は省略（本番では実装要）
        return userId;
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    try {
        // 認証チェック（簡易版: トークンベース、オプション）
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "") || null;
        const userId = verifyToken(token) || "anonymous";

        // レート制限チェック（IPベースまたはユーザーIDベース）
        const clientId = userId !== "anonymous"
            ? userId
            : request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
        
        const rateLimitKey = `rate_limit:${clientId}`;
        // レート制限: 30件/分（一気に15件保存しても問題ないように緩和）
        const rateLimitResult = await checkRateLimit(rateLimitKey, 30, 60000);
        
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    error: "レート制限に達しました。しばらく待ってから再試行してください。",
                    resetAt: rateLimitResult.resetAt,
                },
                { status: 429 }
            );
        }

        const { url, title, content, metaTags, forceSave } = await request.json();

        if (!url || !title) {
            return NextResponse.json(
                { error: "URLとタイトルは必須です" },
                { status: 400 }
            );
        }

        // URLのバリデーション
        let validatedUrl = url;
        try {
            const urlObj = new URL(url);
            validatedUrl = urlObj.href; // 正規化されたURLを使用
        } catch (error) {
            return NextResponse.json(
                { error: "無効なURL形式です" },
                { status: 400 }
            );
        }

        // 求人ページ判定
        const { score, pageType, reasons } = calculateJobPageScore(
            validatedUrl,
            title,
            content || ""
        );

        // pageTypeごとの挙動
        if (pageType === 'non_job') {
            // デフォルトは保存しない（ユーザーが「強制保存」を選択した場合のみ保存）
            if (!forceSave) {
                return NextResponse.json(
                    {
                        error: "このページは求人詳細ページではない可能性があります。",
                        pageType,
                        reasons,
                        canForceSave: true, // 強制保存可能フラグ
                    },
                    { status: 400 }
                );
            }
        }

        // Firebaseの初期化確認
        if (!db) {
            console.error("Firebase初期化エラー: db is null");
            console.error("環境変数チェック:", {
                hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
                hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            });
            return NextResponse.json(
                { error: "Firebaseが初期化されていません。環境変数を確認してください。詳細はサーバーログを確認してください。" },
                { status: 500 }
            );
        }

        // Gemini API呼び出しのレート制限（5件/分）
        const geminiRateLimitKey = `gemini:${clientId}`;
        const geminiRateLimitResult = await checkRateLimit(geminiRateLimitKey, 5, 60000);
        
        if (!geminiRateLimitResult.allowed) {
            return NextResponse.json(
                {
                    error: "AI解析のレート制限に達しました。しばらく待ってから再試行してください。",
                    resetAt: geminiRateLimitResult.resetAt,
                },
                { status: 429 }
            );
        }

        // LLMで求人情報を抽出
        const extractionStart = Date.now();
        safeLog('[API] LLM抽出処理開始...', { url: validatedUrl, title });
        const extractedData = await extractWithGemini(
            validatedUrl,
            title,
            content || "",
            null, // htmlStructureは送信しない
            metaTags || null
        );
        const extractionTime = Date.now() - extractionStart;
        console.log(`[Performance] LLM抽出処理時間: ${extractionTime}ms`);
        safeLog('[API] 最終抽出結果（Firestore保存前）:', extractedData);

        // Firestoreにデータを追加
        const docRef = await addDoc(collection(db, "jobs"), {
            userId, // 認証済みユーザーのID（またはanonymous）
            url: validatedUrl,
            title,
            content: content || "",
            createdAt: serverTimestamp(),
            sourceHost: new URL(validatedUrl).hostname,
            isPinned: false,
            isArchived: false,
            pageType, // 求人ページ判定結果
            pageTypeScore: score, // デバッグ用
            isListPage: pageType === 'job_list', // 一覧ページフラグ
            // 抽出された構造化データ
            companyName: extractedData.companyName,
            jobTitle: extractedData.jobTitle,
            salaryMin: extractedData.salaryMin,
            salaryMax: extractedData.salaryMax,
            salaryBand: extractedData.salaryBand,
            jobDescription: extractedData.jobDescription,
            requiredPerson: extractedData.requiredPerson,
            jobType: extractedData.jobType,
            industry: extractedData.industry,
            locationText: extractedData.locationText,
            remoteType: extractedData.remoteType,
            employmentType: extractedData.employmentType,
            requiredYears: extractedData.requiredYears,
            seniorityLevel: extractedData.seniorityLevel,
        });

        const response = NextResponse.json({
            success: true,
            id: docRef.id,
            pageType, // ページタイプを返す
        });

        // CORSヘッダーを追加（拡張機能IDを環境変数で指定）
        const EXTENSION_ID = process.env.EXTENSION_ID;
        const allowedOrigin = EXTENSION_ID
            ? `chrome-extension://${EXTENSION_ID}`
            : '*'; // 開発環境のみ
        response.headers.set("Access-Control-Allow-Origin", allowedOrigin);

        return response;
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}
