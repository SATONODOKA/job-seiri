"use client";

import { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (!confirm("本当に削除しますか？")) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "jobs", job.id));
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
        isExpanded ? "ring-2 ring-blue-400" : ""
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
      onKeyDown={(e) => e.key === "Enter" && setIsExpanded(!isExpanded)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              {isExpanded ? "▼" : "▶"}
            </span>
            <div>
              <h3 className="font-semibold text-slate-800">
                {job.title || "無題"}
              </h3>
              <p className="text-sm text-slate-500">{getDomain(job.url)}</p>
            </div>
          </div>
          <span className="text-xs text-slate-400">{formatDate(job.createdAt)}</span>
        </div>
      </div>

      {isExpanded && (
        <div 
          className="px-4 pb-4 pt-2 border-t border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 求人内容表示エリア */}
          <div className="mb-4 max-h-80 overflow-y-auto">
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
              {job.content || "内容なし"}
            </p>
          </div>
          
          {/* ボタン */}
          <div className="flex gap-2">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              元ページを開く
            </a>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="py-2 px-4 text-red-500 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
            >
              {isDeleting ? "..." : "削除"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

