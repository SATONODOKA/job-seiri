"use client";

import { useState, useEffect, useMemo } from "react";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
  isSelected?: boolean;
  onSelectChange?: (isSelected: boolean) => void;
  showArchived?: boolean;
}

export default function JobCard({ job, isSelected = false, onSelectChange, showArchived = false }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    companyName: string | null;
    jobTitle: string | null;
    salaryBand: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
  } | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  // クライアント側で再抽出を実行（companyNameまたはjobTitleがない場合）
  useEffect(() => {
    // companyNameまたはjobTitleがない場合、またはsalaryBandがない場合に再抽出
    const needsExtraction = (!job.companyName || !job.jobTitle || !job.salaryBand) && job.content && job.url;
    
    if (needsExtraction) {
      // サーバー側のAPIを呼び出して再抽出
      fetch('/api/jobs/extract-on-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: job.url,
          title: job.title || "",
          content: job.content
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.extracted) {
          console.log('Extraction result for job', job.id, ':', {
            companyName: data.extracted.companyName,
            jobTitle: data.extracted.jobTitle,
            salaryBand: data.extracted.salaryBand
          });
          setExtractedData({
            companyName: data.extracted.companyName,
            jobTitle: data.extracted.jobTitle,
            salaryBand: data.extracted.salaryBand,
            salaryMin: data.extracted.salaryMin,
            salaryMax: data.extracted.salaryMax
          });
        } else {
          console.log('Extraction failed for job', job.id, ':', data);
        }
      })
      .catch(err => {
        console.error("抽出エラー:", err);
      });
    } else {
      // 既にデータがある場合もログ出力
      console.log('Job data already exists for', job.id, ':', {
        companyName: job.companyName,
        jobTitle: job.jobTitle,
        salaryBand: job.salaryBand
      });
    }
  }, [job.id, job.companyName, job.jobTitle, job.salaryBand, job.content, job.url, job.title]);

  // 再抽出結果をFirestoreに自動保存（重複保存を防止）
  useEffect(() => {
    if (!db) {
      console.error("Firebaseが初期化されていません。環境変数を確認してください。");
      return;
    }

    if (!hasSaved && extractedData && (extractedData.companyName || extractedData.jobTitle || extractedData.salaryBand)) {
      // 再抽出結果をFirestoreに保存
      updateDoc(doc(db, "jobs", job.id), {
        companyName: extractedData.companyName || job.companyName || null,
        jobTitle: extractedData.jobTitle || job.jobTitle || null,
        salaryBand: extractedData.salaryBand || job.salaryBand || null,
        salaryMin: extractedData.salaryMin || job.salaryMin || null,
        salaryMax: extractedData.salaryMax || job.salaryMax || null,
      })
      .then(() => {
        console.log('再抽出結果をFirestoreに保存しました:', job.id);
        setHasSaved(true);
      })
      .catch(err => {
        console.error("保存エラー:", err);
      });
    }
  }, [extractedData, hasSaved, job.id, job.companyName, job.jobTitle, job.salaryBand, job.salaryMin, job.salaryMax]);

  // 表示用のデータを計算（useMemoで最適化）
  const displayData = useMemo(() => {
    const companyName = job.companyName || extractedData?.companyName || null;
    const jobTitle = job.jobTitle || extractedData?.jobTitle || null;
    const salaryBand = job.salaryBand || extractedData?.salaryBand || null;
    const salaryMin = job.salaryMin || extractedData?.salaryMin || null;
    const salaryMax = job.salaryMax || extractedData?.salaryMax || null;
    
    return { companyName, jobTitle, salaryBand, salaryMin, salaryMax };
  }, [job.companyName, job.jobTitle, job.salaryBand, job.salaryMin, job.salaryMax, extractedData]);

  const formatDate = (date: Date | null) => {
    if (!date) return "日付不明";
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const handleDelete = async () => {
    if (!confirm(showArchived ? "本当に完全に削除しますか？" : "本当にアーカイブしますか？")) return;

    if (!db) {
      alert("Firebaseが初期化されていません。環境変数を確認してください。");
      return;
    }

    setIsDeleting(true);
    try {
      if (showArchived) {
        // アーカイブから完全削除
        await deleteDoc(doc(db, "jobs", job.id));
      } else {
        // アーカイブに移動
        await updateDoc(doc(db, "jobs", job.id), { isArchived: true });
      }
    } catch (error) {
      console.error("削除エラー:", error);
      alert("操作に失敗しました");
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (!db) {
      alert("Firebaseが初期化されていません。環境変数を確認してください。");
      return;
    }

    try {
      await updateDoc(doc(db, "jobs", job.id), { isArchived: false });
    } catch (error) {
      console.error("復元エラー:", error);
      alert("復元に失敗しました");
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // カードのクリックイベントを防ぐ
    onSelectChange?.(e.target.checked);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
        isExpanded ? "ring-2 ring-blue-400" : ""
      } ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200"
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
      onKeyDown={(e) => e.key === "Enter" && setIsExpanded(!isExpanded)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* チェックボックス */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 flex-shrink-0"
            />
            <span className="text-slate-400 flex-shrink-0">
              {isExpanded ? "▼" : "▶"}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800 truncate">
                {(() => {
                  // 「社名：ポジション」形式で表示
                  const companyName = displayData.companyName;
                  let jobTitle = displayData.jobTitle;
                  
                  // jobTitleに「：」が含まれている場合は除去（先頭の「：」より前を除去）
                  if (jobTitle && jobTitle.includes('：')) {
                    const colonIndex = jobTitle.indexOf('：');
                    // 「：」の前が空文字列または短い場合は、その部分を除去
                    if (colonIndex === 0 || colonIndex < 5) {
                      jobTitle = jobTitle.substring(colonIndex + 1).trim();
                    }
                  }
                  
                  // デバッグログ
                  if (process.env.NODE_ENV === 'development') {
                    console.log('JobCard Display:', {
                      id: job.id,
                      jobCompanyName: job.companyName,
                      extractedCompanyName: extractedData?.companyName,
                      finalCompanyName: companyName,
                      jobJobTitle: job.jobTitle,
                      extractedJobTitle: extractedData?.jobTitle,
                      finalJobTitle: jobTitle
                    });
                  }
                  
                  // 両方ある場合のみ「：」で区切る
                  if (companyName && jobTitle) {
                    return `${companyName}：${jobTitle}`;
                  } else if (companyName) {
                    return companyName;
                  } else if (jobTitle) {
                    return jobTitle;
                  } else {
                    return job.title || "無題";
                  }
                })()}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {(() => {
                  // 年収帯の表示（範囲がある場合は範囲を優先表示）
                  const salaryMin = displayData.salaryMin;
                  const salaryMax = displayData.salaryMax;
                  const salaryBand = displayData.salaryBand;
                  
                  // 範囲がある場合は範囲を表示（salaryMinとsalaryMaxの両方がある場合）
                  if (salaryMin && salaryMax) {
                    // 円単位から万円単位に変換（10000で割る）
                    const minInMillion = Math.floor(salaryMin / 10000);
                    const maxInMillion = Math.floor(salaryMax / 10000);
                    return (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
                        {minInMillion}〜{maxInMillion}万円
                      </span>
                    );
                  } else if (salaryMin) {
                    // salaryMinのみの場合
                    const minInMillion = Math.floor(salaryMin / 10000);
                    return (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
                        {minInMillion}万円以上
                      </span>
                    );
                  } else if (salaryBand) {
                    // salaryBandのみの場合（フィルター用）
                    return (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
                        {salaryBand === "〜500" ? "〜500万円" :
                         salaryBand === "500-700" ? "500-700万円" :
                         salaryBand === "700-900" ? "700-900万円" :
                         salaryBand === "900+" ? "900万円以上" :
                         `${salaryBand}万円`}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {job.jobType && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    {job.jobType}
                  </span>
                )}
                {job.industry && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                    {job.industry}
                  </span>
                )}
                <p className="text-xs text-slate-500 truncate">{getDomain(job.url)}</p>
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{formatDate(job.createdAt)}</span>
        </div>
      </div>

      {isExpanded && (
        <div 
          className="px-4 pb-4 pt-2 border-t border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 職務内容 */}
          {job.jobDescription && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">職務内容</h4>
              <div className="max-h-60 overflow-y-auto">
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {job.jobDescription}
                </p>
              </div>
            </div>
          )}

          {/* 求める人物像 */}
          {job.requiredPerson && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">求める人物像</h4>
              <div className="max-h-60 overflow-y-auto">
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {job.requiredPerson}
                </p>
              </div>
            </div>
          )}

          {/* 抽出されていない場合は元のcontentを表示 */}
          {!job.jobDescription && !job.requiredPerson && (
            <div className="mb-4 max-h-80 overflow-y-auto">
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {job.content || "内容なし"}
              </p>
            </div>
          )}
          
          {/* ボタン */}
          <div className="flex gap-2">
            {(() => {
              // URLのバリデーション
              let isValidUrl = false;
              let validatedUrl = job.url;
              
              if (job.url) {
                try {
                  const urlObj = new URL(job.url);
                  validatedUrl = urlObj.href;
                  isValidUrl = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
                } catch (error) {
                  isValidUrl = false;
                }
              }
              
              if (isValidUrl) {
                return (
                  <a
                    href={validatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    元ページを開く
                  </a>
                );
              } else {
                return (
                  <button
                    disabled
                    className="flex-1 text-center py-2 px-4 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
                    title={job.url ? `無効なURL: ${job.url}` : 'URLが設定されていません'}
                  >
                    元ページを開く（URLなし）
                  </button>
                );
              }
            })()}
            {showArchived ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore();
                  }}
                  className="py-2 px-4 text-blue-500 hover:bg-blue-50 text-sm font-medium rounded-lg transition-colors"
                >
                  復元
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={isDeleting}
                  className="py-2 px-4 text-red-500 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
                >
                  {isDeleting ? "..." : "完全削除"}
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="py-2 px-4 text-red-500 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
              >
                {isDeleting ? "..." : "アーカイブ"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

