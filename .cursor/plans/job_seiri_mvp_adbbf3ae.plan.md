---
name: Job Seiri MVP
overview: 求人ページをワンクリックで保存し、1ページの一覧で後からまとめて読み返せる「自分専用ジョブブックマーク」を作る。AIマッチングは後回し。
todos:
  - id: fix-env
    content: .env.local作成 + devサーバー再起動
    status: pending
  - id: fix-ui
    content: UIデザイン刷新（参考サイトの特徴を反映）
    status: pending
    dependencies:
      - fix-env
  - id: verify
    content: 動作検証（保存、一覧表示、展開、削除）
    status: pending
    dependencies:
      - fix-ui
---

# Job Seiri - 修正プラン

## 完了済み

- [x] Next.jsプロジェクト作成
- [x] Firebase SDK インストール
- [x] lib/firebase.ts作成
- [x] types/job.ts作成
- [x] components/JobInputForm.tsx作成
- [x] components/JobList.tsx作成
- [x] components/JobCard.tsx作成（展開/折りたたみUI）
- [x] Firestoreセキュリティルール設定（Firebase Console）

---

## 残り修正タスク

### タスク1: `.env.local`作成（必須）

**ファイル:** プロジェクトルートに `.env.local` を作成

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDFKthKGygKrqQ2n1MYoSpDJAouHwRp-eY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=job-seiri.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=job-seiri
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=job-seiri.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=506993669324
NEXT_PUBLIC_FIREBASE_APP_ID=1:506993669324:web:693e485bcd9a546aefbe69
```

**作成後、devサーバー再起動必須**

```bash
# Ctrl+C で停止後
npm run dev
```

---

### タスク2: UIデザイン刷新

#### 参考サイト

https://dribbble.com/shots/19382619-Contacts-list-details

#### 参考サイトのデザイン分析

| 要素 | 参考サイトの特徴 ||------|------------------|| **背景** | ライトグレー `#f5f5f5` くらいの柔らかい色 || **カード** | 白背景、軽いシャドウ、角丸12px程度 || **テキスト** | メイン: ダークグレー `#1f2937`、サブ: グレー `#6b7280` || **アクセント** | グリーン系バッジ（ステータス表示） || **リストアイテム** | コンパクト、アバター+名前+ステータス+日時 || **余白** | 適切な余白、詰め込みすぎない || **フォント** | サンセリフ、ウェイトで強弱をつける || **全体の雰囲気** | クリーン、プロフェッショナル、余白を活かす |

#### 適用方針

現状のダークモードを**ライトモード**に変更し、参考サイトのクリーンな雰囲気を再現する。---

#### 2-1. フォント導入

**修正ファイル:** `app/layout.tsx`

```typescript
import { Noto_Sans_JP, Inter } from 'next/font/google';

const notoSansJP = Noto_Sans_JP({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-jp',
});

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**tailwind.config.ts** にフォント設定追加:

```typescript
fontFamily: {
  sans: ['var(--font-inter)', 'var(--font-noto-sans-jp)', 'sans-serif'],
},
```

---

#### 2-2. カラーパレット（ライトモード）

**修正ファイル:** `app/globals.css`

```css
:root {
  /* 背景: 柔らかいライトグレー */
  --bg-primary: #f8fafc;
  --bg-secondary: #f1f5f9;
  
  /* カード: 白 */
  --card-bg: #ffffff;
  --card-border: #e2e8f0;
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
  --card-shadow-hover: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  
  /* テキスト */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  
  /* アクセント: ブルー系 */
  --accent-primary: #3b82f6;
  --accent-primary-hover: #2563eb;
  
  /* ステータスバッジ */
  --badge-new: #10b981;
  --badge-reviewing: #f59e0b;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

---

#### 2-3. 全体レイアウト

**修正ファイル:** `app/page.tsx`

```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Job Seiri</h1>
          <p className="text-slate-500 text-sm mt-1">求人ブックマーク</p>
        </div>

        {/* 入力フォーム */}
        <div className="mb-8">
          <JobInputForm />
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
```

---

#### 2-4. カードデザイン

**修正ファイル:** `components/JobCard.tsx`参考サイトの特徴:

- 白背景
- 軽いシャドウ（控えめ）
- 角丸12px
- ホバーでシャドウが少し強くなる
- 選択時にボーダーハイライト
```tsx
// 閉じた状態
<div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
  <div className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-slate-400">{isExpanded ? "▼" : "▶"}</span>
        <div>
          <h3 className="font-semibold text-slate-800">{job.title}</h3>
          <p className="text-sm text-slate-500">{getDomain(job.url)}</p>
        </div>
      </div>
      <span className="text-xs text-slate-400">{formatDate(job.createdAt)}</span>
    </div>
  </div>
</div>

// 展開時の追加部分
{isExpanded && (
  <div className="px-4 pb-4 pt-2 border-t border-slate-100">
    {/* メモ */}
    <div className="mb-4">
      <label className="text-sm font-medium text-slate-600 mb-1 block">メモ</label>
      <textarea 
        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
        rows={2}
      />
    </div>
    {/* ボタン */}
    <div className="flex gap-2">
      <a className="flex-1 text-center py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors">
        元ページを開く
      </a>
      <button className="py-2 px-4 text-red-500 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors">
        削除
      </button>
    </div>
  </div>
)}
```


---

#### 2-5. 入力フォーム

**修正ファイル:** `components/JobInputForm.tsx`

```tsx
<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
  <h2 className="text-lg font-semibold text-slate-800 mb-4">新しい求人を追加</h2>
  <form className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">URL</label>
      <input
        type="text"
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
        placeholder="https://example.com/jobs/123"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">タイトル（任意）</label>
      <input
        type="text"
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
        placeholder="フロントエンドエンジニア - 株式会社XX"
      />
    </div>
    <button
      type="submit"
      className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors shadow-sm"
    >
      保存
    </button>
  </form>
</div>
```

---

#### 2-6. 空状態・ローディング

```tsx
// 空状態
<div className="text-center py-12">
  <p className="text-slate-400">まだ求人が登録されていません</p>
</div>

// ローディング
<div className="text-center py-12">
  <p className="text-slate-400">読み込み中...</p>
</div>

// 成功メッセージ
<div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
  保存しました
</div>

// エラーメッセージ
<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
  エラーが発生しました
</div>
```

---

### タスク3: 動作検証

修正完了後、以下を確認:

- [ ] URLを入力して保存できる
- [ ] 一覧に表示される
- [ ] 展開/折りたたみが動く
- [ ] メモが保存される
- [ ] 削除できる
- [ ] ページリロード後もデータが残る
- [ ] デザインが参考サイトの雰囲気に近い（ライトモード、クリーン、余白）

---

## 次のPhase（後回し）

### Phase 3: Chrome拡張

- Manifest V3でボタン押下時に現在タブ情報を取得
- Firestoreに直接書き込み

### Phase 4: AIマッチング

- 職務経歴書アップロード