"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

const isDuplicate = async (url: string): Promise<boolean> => {
  const q = query(collection(db, "jobs"), where("url", "==", url));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export default function JobInputForm() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // バリデーション
    if (!url.trim()) {
      setMessage({ type: "error", text: "URLを入力してください" });
      return;
    }

    if (!isValidUrl(url)) {
      setMessage({ type: "error", text: "有効なURLを入力してください" });
      return;
    }

    // 重複チェック
    setIsLoading(true);
    try {
      const duplicate = await isDuplicate(url);
      if (duplicate) {
        setMessage({ type: "error", text: "このURLは既に登録されています" });
        setIsLoading(false);
        return;
      }

      // Firestoreに保存
      await addDoc(collection(db, "jobs"), {
        url,
        title: title.trim() || "無題",
        memo: "",
        createdAt: serverTimestamp(),
      });

      // 成功
      setMessage({ type: "success", text: "保存しました" });
      setUrl("");
      setTitle("");
    } catch (error) {
      console.error("保存エラー:", error);
      setMessage({ type: "error", text: "保存に失敗しました" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">新しい求人を追加</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-slate-600 mb-1">
            URL
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/jobs/123"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-600 mb-1">
            タイトル（任意）
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="フロントエンドエンジニア - 株式会社XX"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "保存中..." : "保存"}
        </button>
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}

