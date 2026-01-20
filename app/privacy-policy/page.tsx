import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー - 求人ブックマーク",
  description: "求人ブックマークのプライバシーポリシー",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-8">プライバシーポリシー</h1>
          
          <div className="prose prose-slate max-w-none space-y-6">
            <section>
              <p className="text-slate-600 leading-relaxed">
                求人ブックマーク（以下「本サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。
                本プライバシーポリシーは、本サービスが収集、使用、保存する情報について説明します。
              </p>
              <p className="text-sm text-slate-500 mt-4">
                最終更新日: {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">1. 収集する情報</h2>
              
              <h3 className="text-xl font-medium text-slate-700 mt-6 mb-3">1.1 認証情報</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>メールアドレス: アカウント作成およびログインに使用します</li>
                <li>パスワード: 暗号化されて保存され、認証に使用します</li>
                <li>ユーザーID: Firebase Authenticationにより自動生成される一意の識別子</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-700 mt-6 mb-3">1.2 求人情報</h3>
              <p className="text-slate-600 mb-3">
                本サービスは、Chrome拡張機能を通じて、ユーザーが保存を選択した求人ページから以下の情報を収集します：
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>求人ページのURL</li>
                <li>ページタイトル</li>
                <li>ページのテキストコンテンツ（最大20,000文字）</li>
                <li>メタタグ情報（最小化、または送信しない）</li>
              </ul>
              <p className="text-sm text-slate-500 mt-2">
                注意: HTML構造は送信しません（プライバシー保護のため）。
              </p>

              <h3 className="text-xl font-medium text-slate-700 mt-6 mb-3">1.3 抽出された求人情報</h3>
              <p className="text-slate-600 mb-3">
                収集した求人ページの情報から、Google Gemini APIを使用して以下の情報を抽出し、構造化データとして保存します：
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>会社名</li>
                <li>職種名</li>
                <li>年収（下限・上限）</li>
                <li>年収帯</li>
                <li>勤務地</li>
                <li>リモートワーク種別</li>
                <li>雇用形態</li>
                <li>必要経験年数</li>
                <li>シニアリティレベル</li>
                <li>仕事内容</li>
                <li>求める人物像・応募要件</li>
                <li>職種カテゴリ</li>
                <li>業種</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">2. 情報の使用目的</h2>
              <p className="text-slate-600 mb-3">
                本サービスは、収集した情報を以下の目的でのみ使用します：
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>ユーザーアカウントの作成、認証、管理</li>
                <li>求人情報の保存と管理</li>
                <li>求人情報の自動抽出と構造化（AI技術を使用）</li>
                <li>求人情報の表示、検索、フィルタリング、ソート機能の提供</li>
                <li>サービス品質の向上と技術的な問題の解決</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">3. データの保存と管理</h2>
              
              <h3 className="text-xl font-medium text-slate-700 mt-6 mb-3">3.1 データ保存場所</h3>
              <p className="text-slate-600 mb-3">
                本サービスは、以下のサービスを使用してデータを保存・管理します：
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li><strong>Firebase (Google Cloud Platform)</strong>: 認証情報と求人データを保存</li>
                <li>データはGoogle Cloud Platformのサーバーに保存され、ユーザーごとに分離されています</li>
              </ul>

              <h3 className="text-xl font-medium text-slate-700 mt-6 mb-3">3.2 データの保持期間</h3>
              <p className="text-slate-600 mb-3">
                ユーザーがアカウントを削除するまで、または明示的にデータを削除するまで、データは保持されます。
                アーカイブ機能により、一時的に非表示にしたデータも保持されます。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">4. 外部サービスへの情報提供</h2>
              
              <h3 className="text-xl font-medium text-slate-700 mt-6 mb-3">4.1 Google Firebase</h3>
              <p className="text-slate-600 mb-3">
                認証情報と求人データは、Google Firebase（Firestore）に保存されます。
                Firebaseのプライバシーポリシーは以下のURLで確認できます：
              </p>
              <p className="text-slate-600 mb-3">
                <a 
                  href="https://firebase.google.com/support/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  https://firebase.google.com/support/privacy
                </a>
              </p>

              <h3 className="text-xl font-medium text-slate-700 mt-6 mb-3">4.2 Google Gemini API</h3>
              <p className="text-slate-600 mb-3">
                求人情報の抽出処理において、収集したページコンテンツをGoogle Gemini APIに送信します。
                この処理はサーバー側で実行され、求人情報の構造化のみを目的としています。
                Gemini APIのプライバシーポリシーは以下のURLで確認できます：
              </p>
              <p className="text-slate-600 mb-3">
                <a 
                  href="https://ai.google.dev/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  https://ai.google.dev/terms
                </a>
              </p>
              <p className="text-slate-600 mb-3">
                本サービスは、Gemini APIに送信されたデータが学習に使用されないよう設定していますが、
                Googleのサービス利用規約に従います。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">5. データの共有と開示</h2>
              <p className="text-slate-600 mb-3">
                本サービスは、以下の場合を除き、ユーザーの個人情報を第三者に開示または共有しません：
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>ユーザーの明示的な同意がある場合</li>
                <li>法令に基づく開示が求められる場合</li>
                <li>本サービスの利用規約に違反する行為を防止するため、必要な場合</li>
              </ul>
              <p className="text-slate-600 mt-4 mb-3">
                ユーザーが保存した求人情報は、他のユーザーと共有されません。
                各ユーザーのデータは、Firebase AuthenticationのユーザーIDにより分離されています。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">6. ユーザーの権利</h2>
              <p className="text-slate-600 mb-3">
                ユーザーは、以下の権利を有します：
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li><strong>アクセス権</strong>: 保存されている自分のデータを確認できます</li>
                <li><strong>削除権</strong>: アプリケーション内から求人データを削除できます</li>
                <li><strong>アカウント削除権</strong>: アカウントを削除することで、すべてのデータを削除できます</li>
                <li><strong>修正権</strong>: 求人情報の再抽出により、データを更新できます</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">7. セキュリティ</h2>
              <p className="text-slate-600 mb-3">
                本サービスは、ユーザーの個人情報を保護するため、以下のセキュリティ対策を実施しています：
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>Firebase Authenticationによる安全な認証</li>
                <li>パスワードの暗号化保存</li>
                <li>HTTPS通信によるデータ転送の暗号化</li>
                <li>Firebase Security Rulesによるデータアクセス制御</li>
                <li>ユーザーごとのデータ分離</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">8. クッキーとトラッキング技術</h2>
              <p className="text-slate-600 mb-3">
                本サービスは、Firebase Authenticationのセッション管理のためにクッキーを使用します。
                本サービスは、広告配信やトラッキング目的でクッキーを使用しません。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">9. 未成年者の利用</h2>
              <p className="text-slate-600 mb-3">
                本サービスは、18歳未満のユーザーからの個人情報を意図的に収集しません。
                保護者の方は、お子様が本サービスを利用している場合、適切な監督を行ってください。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">10. プライバシーポリシーの変更</h2>
              <p className="text-slate-600 mb-3">
                本プライバシーポリシーは、法令の変更やサービスの改善に伴い、予告なく変更される場合があります。
                重要な変更がある場合は、本ページで通知します。
                変更後のプライバシーポリシーは、本ページに掲載された時点で効力を生じます。
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">11. お問い合わせ</h2>
              <p className="text-slate-600 mb-3">
                本プライバシーポリシーに関するご質問やご意見がございましたら、
                以下の方法でお問い合わせください：
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2 ml-4">
                <li>メールアドレス: <a 
                  href="mailto:satonodoka98@gmail.com" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  satonodoka98@gmail.com
                </a></li>
                <li>サービスURL: <a 
                  href="https://kyujin-bookmark.netlify.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  https://kyujin-bookmark.netlify.app
                </a></li>
              </ul>
            </section>

            <section className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                本プライバシーポリシーは、日本の個人情報保護法および関連法令に準拠しています。
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
