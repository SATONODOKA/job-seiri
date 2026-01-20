"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, onSnapshot, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Job } from "@/types/job";
import JobCard from "./JobCard";
import JobFilters, { FilterState } from "./JobFilters";

type SortField = "createdAt" | "companyName" | "jobTitle" | "salaryMin" | "salaryMax";
type SortOrder = "asc" | "desc";

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filters, setFilters] = useState<FilterState>({
    jobType: null,
    industry: null,
    salaryBand: null,
    salaryMin: null,
    salaryMax: null,
  });

  const [showArchived, setShowArchived] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Firebaseの初期化確認
    if (!db) {
      console.error("Firebaseが初期化されていません。環境変数を確認してください。");
      setIsLoading(false);
      return;
    }

    // リアルタイムリスナー（アーカイブ状態でフィルタリング）
    const q = query(
      collection(db, "jobs"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          // デバッグ: 最初のドキュメントのデータを確認
          if (process.env.NODE_ENV === 'development' && doc.id === snapshot.docs[0]?.id) {
            console.log('Firestore Data Sample:', {
              id: doc.id,
              companyName: data.companyName,
              jobTitle: data.jobTitle,
              salaryBand: data.salaryBand,
              salaryMin: data.salaryMin,
              salaryMax: data.salaryMax,
              isArchived: data.isArchived,
              hasContent: !!data.content,
              allFields: Object.keys(data)
            });
          }
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || null,
            isArchived: data.isArchived ?? false,
            isPinned: data.isPinned ?? false,
          } as Job;
        });
        setJobs(jobsData);
        setIsLoading(false);
      },
      (error) => {
        console.error("データ取得エラー:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // フィルタリングとソート
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = [...jobs];
    
    // アーカイブ状態でフィルタリング
    filtered = filtered.filter((job) => job.isArchived === showArchived);

    // フィルタリング
    if (filters.jobType) {
      filtered = filtered.filter((job) => job.jobType === filters.jobType);
    }
    if (filters.industry) {
      filtered = filtered.filter((job) => job.industry === filters.industry);
    }
    if (filters.salaryBand) {
      filtered = filtered.filter((job) => job.salaryBand === filters.salaryBand);
    }
    // 年収下限フィルタ（salaryMinまたはsalaryMaxの下限が指定値以上）
    if (filters.salaryMin !== null) {
      const minThreshold = filters.salaryMin * 10000; // 万円を円に変換
      filtered = filtered.filter((job) => {
        const jobMin = job.salaryMin;
        const jobMax = job.salaryMax;
        // salaryMinがある場合はそれを使用、ない場合はsalaryMaxを使用
        const effectiveMin = jobMin ?? jobMax;
        return effectiveMin !== null && effectiveMin >= minThreshold;
      });
    }
    // 年収上限フィルタ（salaryMaxまたはsalaryMinの上限が指定値以下）
    if (filters.salaryMax !== null) {
      const maxThreshold = filters.salaryMax * 10000; // 万円を円に変換
      filtered = filtered.filter((job) => {
        const jobMax = job.salaryMax;
        const jobMin = job.salaryMin;
        // salaryMaxがある場合はそれを使用、ない場合はsalaryMinを使用
        const effectiveMax = jobMax ?? jobMin;
        return effectiveMax !== null && effectiveMax <= maxThreshold;
      });
    }

    // ソート
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "companyName":
          aValue = a.companyName || a.title || "";
          bValue = b.companyName || b.title || "";
          break;
        case "jobTitle":
          aValue = a.jobTitle || a.title || "";
          bValue = b.jobTitle || b.title || "";
          break;
        case "salaryMin":
          aValue = a.salaryMin ?? 0;
          bValue = b.salaryMin ?? 0;
          break;
        case "salaryMax":
          aValue = a.salaryMax ?? 0;
          bValue = b.salaryMax ?? 0;
          break;
        case "createdAt":
        default:
          aValue = a.createdAt?.getTime() ?? 0;
          bValue = b.createdAt?.getTime() ?? 0;
          break;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [jobs, filters, sortField, sortOrder, showArchived]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  const handleSelectJob = (jobId: string, isSelected: boolean) => {
    setSelectedJobIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(jobId);
      } else {
        newSet.delete(jobId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedJobIds.size === filteredAndSortedJobs.length) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(filteredAndSortedJobs.map(job => job.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobIds.size === 0) return;
    if (!confirm(`選択した${selectedJobIds.size}件の求人を${showArchived ? '完全に削除' : 'アーカイブ'}しますか？`)) return;

    if (!db) {
      alert("Firebaseが初期化されていません。");
      return;
    }

    try {
      const firestoreDb = db; // TypeScriptの型チェックを通過させるため
      const promises = Array.from(selectedJobIds).map(jobId => {
        if (showArchived) {
          // アーカイブから完全削除
          return deleteDoc(doc(firestoreDb, "jobs", jobId));
        } else {
          // アーカイブに移動
          return updateDoc(doc(firestoreDb, "jobs", jobId), { isArchived: true });
        }
      });
      await Promise.all(promises);
      setSelectedJobIds(new Set());
    } catch (error) {
      console.error("一括操作エラー:", error);
      alert("操作に失敗しました");
    }
  };

  return (
    <div>
      {/* タブ切り替えとフィルタ・ソートを1つのコンテナにまとめる */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 space-y-3">
        {/* タブ切り替え */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !showArchived
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              求人一覧
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showArchived
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              アーカイブ
            </button>
          </div>
          {selectedJobIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {showArchived ? '完全削除' : 'アーカイブ'} ({selectedJobIds.size}件)
            </button>
          )}
        </div>

        {/* フィルタとソートを横並びに */}
        <div className="flex flex-wrap items-center gap-3">
          {/* フィルタ */}
          <JobFilters jobs={jobs.filter(j => j.isArchived === showArchived)} onFilterChange={setFilters} />

          {/* ソート */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs font-medium text-slate-700 whitespace-nowrap">並び替え:</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="text-xs bg-white border-2 border-slate-400 text-slate-900 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500 transition-colors"
            >
              <option value="createdAt">保存日</option>
              <option value="companyName">社名</option>
              <option value="jobTitle">役職名</option>
              <option value="salaryMin">年収（下限）</option>
              <option value="salaryMax">年収（上限）</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              {sortOrder === "asc" ? "↑ 昇順" : "↓ 降順"}
            </button>
          </div>
        </div>

        {/* 全選択チェックボックス */}
        {filteredAndSortedJobs.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
            <input
              type="checkbox"
              checked={selectedJobIds.size === filteredAndSortedJobs.length && filteredAndSortedJobs.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label className="text-xs text-slate-700">
              {selectedJobIds.size > 0 ? `${selectedJobIds.size}件選択中` : 'すべて選択'}
            </label>
          </div>
        )}
      </div>

      {/* 求人リスト */}
      {filteredAndSortedJobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {showArchived ? 'アーカイブされた求人はありません' : 'フィルタに一致する求人がありません'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSelected={selectedJobIds.has(job.id)}
              onSelectChange={(isSelected) => handleSelectJob(job.id, isSelected)}
              showArchived={showArchived}
            />
          ))}
        </div>
      )}
    </div>
  );
}

