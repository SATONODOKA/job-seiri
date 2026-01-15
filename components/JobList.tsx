"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Job } from "@/types/job";
import JobCard from "./JobCard";
import JobFilters, { FilterState } from "./JobFilters";

type SortField = "createdAt" | "companyName" | "jobTitle" | "salaryMin";
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
  });

  useEffect(() => {
    // Firebaseの初期化確認
    if (!db) {
      console.error("Firebaseが初期化されていません。環境変数を確認してください。");
      setIsLoading(false);
      return;
    }

    // リアルタイムリスナー
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
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
              hasContent: !!data.content,
              allFields: Object.keys(data)
            });
          }
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || null,
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
  }, [jobs, filters, sortField, sortOrder]);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">まだ求人が登録されていません</p>
      </div>
    );
  }

  return (
    <div>
      {/* フィルタ */}
      <JobFilters jobs={jobs} onFilterChange={setFilters} />

      {/* ソート */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">並び替え:</label>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="text-sm bg-white border-2 border-slate-400 text-slate-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500 transition-colors"
          >
            <option value="createdAt">保存日</option>
            <option value="companyName">社名</option>
            <option value="jobTitle">役職名</option>
            <option value="salaryMin">年収</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="text-sm px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {sortOrder === "asc" ? "↑ 昇順" : "↓ 降順"}
          </button>
        </div>
      </div>

      {/* 求人リスト */}
      {filteredAndSortedJobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">フィルタに一致する求人がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

