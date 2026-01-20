import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { extractWithGemini } from "@/lib/llm/providers/gemini";

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}

export async function POST(request: Request) {
    try {
        const { url, title, content, htmlStructure, metaTags } = await request.json();

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

        // LLMで求人情報を抽出
        const extractionStart = Date.now();
        console.log('[API] LLM抽出処理開始...');
        const extractedData = await extractWithGemini(
            validatedUrl,
            title,
            content || "",
            htmlStructure || null,
            metaTags || null
        );
        const extractionTime = Date.now() - extractionStart;
        console.log(`[Performance] LLM抽出処理時間: ${extractionTime}ms`);
        console.log('[API] 最終抽出結果（Firestore保存前）:', JSON.stringify(extractedData, null, 2));

        // Firestoreにデータを追加
        const docRef = await addDoc(collection(db, "jobs"), {
            url: validatedUrl,
            title,
            content: content || "",
            createdAt: serverTimestamp(),
            sourceHost: new URL(validatedUrl).hostname,
            isPinned: false,
            isArchived: false,
            pageType: "unknown",
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
        });

        // CORSヘッダーを追加
        response.headers.set("Access-Control-Allow-Origin", "*");

        return response;
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}
