import { NextResponse } from "next/server";
import { adminDbInstance } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { extractWithGemini } from "@/lib/llm/providers/gemini";
import { checkRateLimit } from "@/lib/rateLimit";
import { calculateJobPageScore } from "@/lib/jobPageDetector";
import { safeLog } from "@/lib/safeLog";
import { verifyIdToken } from "@/lib/firebaseAdmin";

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: getCorsHeaders()
    });
}

// CORSヘッダーを取得するヘルパー関数
function getCorsHeaders() {
    const EXTENSION_ID = process.env.EXTENSION_ID;
    const allowedOrigin = EXTENSION_ID
        ? `chrome-extension://${EXTENSION_ID}`
        : '*'; // 開発環境のみ
    
    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
}

export async function POST(request: Request) {
    try {
        // 注意: 拡張機能からはFirebase IDトークンを送信していないため、
        // 一時的にanonymousとして保存する
        // 将来的には、拡張機能側でFirebase AuthenticationのIDトークンを取得して送信する必要がある
        
        // Firebase IDトークンを検証してユーザーIDを取得（将来の実装用）
        const authHeader = request.headers.get("Authorization");
        const idToken = authHeader?.replace("Bearer ", "") || null;
        
        let userId: string | null = null;
        if (idToken) {
            // Firebase IDトークンを検証
            userId = await verifyIdToken(idToken);
        }
        
        // 認証されていない場合はanonymous
        // 注意: 拡張機能から保存されたデータはanonymousになる
        // Webアプリ側でログインしているユーザーと紐づけるには、別の仕組みが必要
        if (!userId) {
            userId = "anonymous";
        }

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
                { 
                    status: 429,
                    headers: getCorsHeaders()
                }
            );
        }

        const { url, title, content, metaTags, forceSave } = await request.json();

        if (!url || !title) {
            return NextResponse.json(
                { error: "URLとタイトルは必須です" },
                { 
                    status: 400,
                    headers: getCorsHeaders()
                }
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
                { 
                    status: 400,
                    headers: getCorsHeaders()
                }
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
                    { 
                        status: 400,
                        headers: getCorsHeaders()
                    }
                );
            }
        }

        // Firebase Adminの初期化確認
        if (!adminDbInstance) {
            console.error("Firebase Admin初期化エラー: adminDbInstance is null");
            console.error("環境変数チェック:", {
                hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
            });
            return NextResponse.json(
                { error: "Firebase Adminが初期化されていません。FIREBASE_SERVICE_ACCOUNT_KEY環境変数を確認してください。詳細はサーバーログを確認してください。" },
                { 
                    status: 500,
                    headers: getCorsHeaders()
                }
            );
        }

        // Gemini API呼び出しのレート制限（10件/分に緩和、コスト保護のため）
        // 注意: 一気に15件保存する場合、Gemini APIの処理は順次実行されるため、
        // 実際のAPI呼び出しは時間をかけて分散される
        const geminiRateLimitKey = `gemini:${clientId}`;
        const geminiRateLimitResult = await checkRateLimit(geminiRateLimitKey, 10, 60000);
        
        if (!geminiRateLimitResult.allowed) {
            return NextResponse.json(
                {
                    error: "AI解析のレート制限に達しました。しばらく待ってから再試行してください。",
                    resetAt: geminiRateLimitResult.resetAt,
                },
                { 
                    status: 429,
                    headers: getCorsHeaders()
                }
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

        // Firestoreにデータを追加（Admin SDKを使用）
        console.log('[API] Firestoreにデータを保存開始...', { userId, url: validatedUrl, title });
        const docRef = await adminDbInstance.collection("jobs").add({
            userId, // 認証済みユーザーのID（またはanonymous）
            url: validatedUrl,
            title,
            content: content || "",
            createdAt: FieldValue.serverTimestamp(),
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

        console.log('[API] Firestoreにデータを保存完了:', { id: docRef.id, userId, pageType });

        const response = NextResponse.json({
            success: true,
            id: docRef.id,
            pageType, // ページタイプを返す
        }, {
            headers: getCorsHeaders()
        });

        return response;
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "サーバーエラーが発生しました" },
            { 
                status: 500,
                headers: getCorsHeaders()
            }
        );
    }
}
