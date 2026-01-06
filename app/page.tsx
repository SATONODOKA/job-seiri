"use client";

import { useAuth } from "@/contexts/AuthContext";
import JobList from "@/components/JobList";
import LoginForm from "@/components/LoginForm";

export default function Home() {
  const { user, loading, logout } = useAuth();

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">読み込み中...</p>
      </div>
    );
  }

  // 未ログイン
  if (!user) {
    return <LoginForm />;
  }

  // ログイン済み
  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Job Seiri</h1>
            <p className="text-slate-500 text-sm mt-1">求人ブックマーク</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            ログアウト
          </button>
        </div>

        {/* 一覧 */}
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">保存した求人</h2>
          <JobList />
        </div>
      </div>
    </main>
  );
}
