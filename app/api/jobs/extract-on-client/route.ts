import { NextResponse } from "next/server";
import { extractWithGemini } from "@/lib/llm/providers/gemini";

export async function POST(request: Request) {
    try {
        const { url, title, content } = await request.json();

        if (!url || !title) {
            return NextResponse.json(
                { error: "URLとタイトルは必須です" },
                { status: 400 }
            );
        }

        // LLMで求人情報を抽出
        const extractedData = await extractWithGemini(url, title, content || "");

        return NextResponse.json({
            success: true,
            extracted: extractedData
        });
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}
