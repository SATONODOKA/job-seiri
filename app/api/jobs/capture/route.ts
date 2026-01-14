import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { extractJobData } from "@/lib/parsers/jobExtractor";

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
        const { url, title, content } = await request.json();

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

        // 求人情報を抽出
        const extractedData = extractJobData(validatedUrl, title, content || "");

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
