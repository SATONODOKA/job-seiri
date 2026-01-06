import JobList from "@/components/JobList";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Job Seiri</h1>
          <p className="text-slate-500 text-sm mt-1">求人ブックマーク</p>
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
