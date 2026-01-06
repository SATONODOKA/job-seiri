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
  const [memo, setMemo] = useState(job.memo || "");
  const [isSavingMemo, setIsSavingMemo] = useState(false);
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

  const handleSaveMemo = async () => {
    setIsSavingMemo(true);
    try {
      await updateDoc(doc(db, "jobs", job.id), {
        memo: memo,
      });
    } catch (error) {
      console.error("メモ保存エラー:", error);
      alert("メモの保存に失敗しました");
    } finally {
      setIsSavingMemo(false);
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
      className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
        isExpanded ? "ring-2 ring-blue-400" : ""
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
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
          {/* メモ */}
          <div className="mb-4">
            <label className="text-sm font-medium text-slate-600 mb-1 block">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={handleSaveMemo}
              placeholder="メモを入力..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
              rows={2}
              disabled={isSavingMemo}
            />
            {isSavingMemo && (
              <p className="text-xs text-slate-400 mt-1">保存中...</p>
            )}
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
              className="py-2 px-4 text-red-500 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "削除中..." : "削除"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

