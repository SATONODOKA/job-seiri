"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log("Login attempt:", { email, isSignUp });

    if (!auth) {
      setError("Firebaseが初期化されていません。環境変数を確認してください。");
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        console.log("Creating user...");
        const result = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User created:", result.user.uid);
      } else {
        console.log("Signing in...");
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log("User signed in:", result.user.uid);
      }
    } catch (err: unknown) {
      console.error("Auth error:", err);
      
      // Firebaseエラーコードを取得
      let errorCode = "";
      let errorMessage = "エラーが発生しました";
      
      if (err && typeof err === 'object' && 'code' in err) {
        errorCode = String(err.code);
        if ('message' in err) {
          errorMessage = String(err.message);
        } else {
          errorMessage = String(err.code);
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      console.error("Error code:", errorCode);
      console.error("Error message:", errorMessage);
      
      // エラーコードに基づいて適切なメッセージを表示
      if (errorCode.includes("auth/network-request-failed") || errorMessage.includes("network-request-failed")) {
        setError("ネットワークエラーが発生しました。インターネット接続を確認してください。\n\nもしくは、Firebaseの環境変数が正しく設定されていない可能性があります。");
      } else if (errorCode.includes("auth/invalid-credential") || errorMessage.includes("invalid-credential")) {
        setError("メールアドレスまたはパスワードが正しくありません");
      } else if (errorCode.includes("auth/email-already-in-use") || errorMessage.includes("email-already-in-use")) {
        setError("このメールアドレスは既に使用されています");
      } else if (errorCode.includes("auth/weak-password") || errorMessage.includes("weak-password")) {
        setError("パスワードは6文字以上にしてください");
      } else if (errorCode.includes("auth/invalid-email") || errorMessage.includes("invalid-email")) {
        setError("メールアドレスの形式が正しくありません");
      } else if (errorCode.includes("auth/user-not-found") || errorMessage.includes("user-not-found")) {
        setError("このメールアドレスのアカウントが見つかりません");
      } else {
        setError(`エラー: ${errorMessage}\n\nエラーコード: ${errorCode || '不明'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">求人ブックマーク</h1>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            {isSignUp ? "アカウント作成" : "ログイン"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="example@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="6文字以上"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? "..." : isSignUp ? "アカウント作成" : "ログイン"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {isSignUp ? "既にアカウントをお持ちの方" : "アカウントを作成"}
            </button>
          </div>
        </div>

        {/* 使い方説明 */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-100 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <span className="mr-2">💡</span>
            使い方
          </h2>
          <div className="space-y-4 text-sm text-blue-800">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-semibold">拡張機能を追加</p>
                <p className="text-blue-600 mt-0.5">ブラウザに 求人ブックマーク 拡張機能を追加します。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-semibold">求人ページを開く</p>
                <p className="text-blue-600 mt-0.5">気になる求人の詳細ページ（具体的な情報の掲載ページ）を開きます。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-semibold">ボタンを押して保存</p>
                <p className="text-blue-600 mt-0.5">拡張機能のボタンを押すと、このサイトに求人情報が自動的に保存されます。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


