import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "サポート - 求人ブックマーク",
  description: "求人ブックマークのサポートページ",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-8">サポート</h1>
          
          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">よくある質問（FAQ）</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-slate-700 mb-2">Q: 拡張機能が動作しません</h3>
                  <p className="text-slate-600">
                    A: 以下の点を確認してください：
                  </p>
                  <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4 mt-2">
                    <li>拡張機能が有効になっているか確認</li>
                    <li>通常のWebページ（http:// または https:// で始まるページ）で使用しているか確認</li>
                    <li>ブラウザを再起動してみる</li>
                    <li>拡張機能を再インストールしてみる</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-slate-700 mb-2">Q: 保存した求人が表示されません</h3>
                  <p className="text-slate-600">
                    A: 以下の点を確認してください：
                  </p>
                  <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4 mt-2">
                    <li>Webアプリにログインしているか確認</li>
                    <li>ブラウザをリロードしてみる</li>
                    <li>フィルター設定を確認</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-slate-700 mb-2">Q: データを削除する方法は？</h3>
                  <p className="text-slate-600">
                    A: Webアプリの求人カードから「アーカイブ」または「完全削除」ボタンで削除できます。
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium text-slate-700 mb-2">Q: プライバシーについて</h3>
                  <p className="text-slate-600">
                    A: 詳細は<a href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">プライバシーポリシー</a>をご確認ください。
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">お問い合わせ</h2>
              <p className="text-slate-600 mb-3">
                問題が解決しない場合、以下の方法でお問い合わせください：
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>サービスURL: <a href="https://job-seiri.netlify.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">https://job-seiri.netlify.app</a></li>
                <li>プライバシーポリシー: <a href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline">プライバシーポリシー</a></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
