import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
import { extractJobData } from "@/lib/parsers/jobExtractor";

export async function POST(request: Request) {
    try {
        // Firebaseの初期化確認
        if (!db) {
            return NextResponse.json(
                { error: "Firebaseが初期化されていません。環境変数を確認してください。" },
                { status: 500 }
            );
        }

        const { jobId } = await request.json();

        if (jobId) {
            // 特定のジョブを再抽出
            const jobDoc = doc(db, "jobs", jobId);
            const jobSnapshot = await getDocs(collection(db, "jobs"));
            const job = jobSnapshot.docs.find(d => d.id === jobId);
            
            if (!job) {
                return NextResponse.json(
                    { error: "ジョブが見つかりません" },
                    { status: 404 }
                );
            }

            const jobData = job.data();
            const extractedData = extractJobData(
                jobData.url,
                jobData.title,
                jobData.content || ""
            );

            await updateDoc(jobDoc, {
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

            return NextResponse.json({
                success: true,
                id: jobId,
                extracted: extractedData
            });
        } else {
            // すべてのジョブを再抽出（companyName、jobTitle、salaryBandのいずれかがnullまたは空のもの）
            const jobsSnapshot = await getDocs(collection(db, "jobs"));
            const jobs = jobsSnapshot.docs;
            const results = [];

            for (const jobDoc of jobs) {
                const jobData = jobDoc.data();
                
                // companyName、jobTitle、salaryBandのいずれかがnullまたは空文字列の場合に再抽出
                const needsReExtraction = (
                    !jobData.companyName || 
                    !jobData.jobTitle || 
                    !jobData.salaryBand
                ) && jobData.title && jobData.content;
                
                if (needsReExtraction) {
                    const extractedData = extractJobData(
                        jobData.url || "",
                        jobData.title,
                        jobData.content || ""
                    );

                    await updateDoc(doc(db, "jobs", jobDoc.id), {
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

                    results.push({
                        id: jobDoc.id,
                        title: jobData.title,
                        companyName: extractedData.companyName,
                        jobTitle: extractedData.jobTitle
                    });
                }
            }

            return NextResponse.json({
                success: true,
                count: results.length,
                results
            });
        }
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}
