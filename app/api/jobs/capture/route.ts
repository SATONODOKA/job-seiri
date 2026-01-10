import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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

        // Firestoreにデータを追加
        const docRef = await addDoc(collection(db, "jobs"), {
            url,
            title,
            content: content || "",
            createdAt: serverTimestamp(),
            sourceHost: new URL(url).hostname,
            isPinned: false,
            isArchived: false,
            pageType: "unknown",
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
