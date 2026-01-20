"use client";

import React from "react";
import { Job } from "@/types/job";

interface JobFiltersProps {
  jobs: Job[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  jobType: string | null;
  industry: string | null;
  salaryBand: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
}

export default function JobFilters({ jobs, onFilterChange }: JobFiltersProps) {
  // 利用可能なタグを抽出
  const jobTypes = Array.from(
    new Set(jobs.map(j => j.jobType).filter((t): t is string => t !== null))
  ).sort();

  const industries = Array.from(
    new Set(jobs.map(j => j.industry).filter((i): i is string => i !== null))
  ).sort();

  const salaryBands: ("〜500" | "500-700" | "700-900" | "900+")[] = [
    "〜500",
    "500-700",
    "700-900",
    "900+"
  ];

  const [filters, setFilters] = React.useState<FilterState>({
    jobType: null,
    industry: null,
    salaryBand: null,
    salaryMin: null,
    salaryMax: null,
  });

  const handleFilterChange = (key: keyof FilterState, value: string | number | null) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
      <div className="flex flex-wrap gap-3">
        {/* 職種フィルタ */}
        {jobTypes.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">職種:</label>
            <select
              value={filters.jobType || ""}
              onChange={(e) => handleFilterChange("jobType", e.target.value || null)}
              className="text-sm bg-white border-2 border-slate-400 text-slate-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500 transition-colors"
            >
              <option value="">すべて</option>
              {jobTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 業種フィルタ */}
        {industries.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">業種:</label>
            <select
              value={filters.industry || ""}
              onChange={(e) => handleFilterChange("industry", e.target.value || null)}
              className="text-sm bg-white border-2 border-slate-400 text-slate-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500 transition-colors"
            >
              <option value="">すべて</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 年収帯フィルタ（下限） */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">年収下限:</label>
          <select
            value={filters.salaryMin?.toString() || ""}
            onChange={(e) => handleFilterChange("salaryMin", e.target.value ? parseInt(e.target.value) : null)}
            className="text-sm bg-white border-2 border-slate-400 text-slate-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500 transition-colors"
          >
            <option value="">すべて</option>
            <option value="300">300万円以上</option>
            <option value="400">400万円以上</option>
            <option value="500">500万円以上</option>
            <option value="600">600万円以上</option>
            <option value="700">700万円以上</option>
            <option value="800">800万円以上</option>
            <option value="900">900万円以上</option>
            <option value="1000">1000万円以上</option>
          </select>
        </div>

        {/* 年収帯フィルタ（上限） */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">年収上限:</label>
          <select
            value={filters.salaryMax?.toString() || ""}
            onChange={(e) => handleFilterChange("salaryMax", e.target.value ? parseInt(e.target.value) : null)}
            className="text-sm bg-white border-2 border-slate-400 text-slate-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500 transition-colors"
          >
            <option value="">すべて</option>
            <option value="500">500万円以下</option>
            <option value="600">600万円以下</option>
            <option value="700">700万円以下</option>
            <option value="800">800万円以下</option>
            <option value="900">900万円以下</option>
            <option value="1000">1000万円以下</option>
            <option value="1500">1500万円以下</option>
            <option value="2000">2000万円以下</option>
          </select>
        </div>

        {/* 年収帯フィルタ（従来の方式も残す） */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">年収帯:</label>
          <select
            value={filters.salaryBand || ""}
            onChange={(e) => handleFilterChange("salaryBand", e.target.value || null)}
            className="text-sm bg-white border-2 border-slate-400 text-slate-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500 transition-colors"
          >
            <option value="">すべて</option>
            {salaryBands.map((band) => (
              <option key={band} value={band}>
                {band}万円
              </option>
            ))}
          </select>
        </div>

        {/* フィルタリセット */}
        {(filters.jobType || filters.industry || filters.salaryBand || filters.salaryMin || filters.salaryMax) && (
          <button
            onClick={() => {
              const resetFilters = { jobType: null, industry: null, salaryBand: null, salaryMin: null, salaryMax: null };
              setFilters(resetFilters);
              onFilterChange(resetFilters);
            }}
            className="text-sm text-slate-600 hover:text-slate-800 underline"
          >
            リセット
          </button>
        )}
      </div>
    </div>
  );
}
