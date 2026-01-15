# Job Seiri - 次のステップ分析

## 📊 現状分析（plan.md vs 実装状況）

### ✅ 実装済み（計画より先行）
- ✅ Phase 2/3: 構造化フィールド抽出（companyName, jobTitle, salary等）
- ✅ JobFiltersコンポーネント（jobType, industry, salaryBandでフィルタリング）
- ✅ ソート機能（日付、社名、役職、年収）
- ✅ JobCardの拡張表示（バッジ、構造化セクション）
- ✅ クライアント側自動再抽出機能
- ✅ Playwright導入

### ❌ 未実装（plan.mdで最優先とされている機能）

#### 1. Phase 1: 応募ステータス管理（最優先）
**plan.md Phase 1.1-1.4で定義されているが未実装**

**不足している型定義**:
```typescript
// types/job.ts に追加が必要
applicationStatus: "not_applied" | "applied" | "interview" | "offer" | "rejected" | "withdrawn" | null;
applicationDate: Date | null;
userNote: string | null;
userRating: number | null; // 0-5
```

**不足しているUI**:
- JobCard展開時に応募ステータスのドロップダウン
- メモ入力欄（textarea）
- 評価の星アイコン（0-5段階）
- 保存ボタン（Firestoreに更新）

**不足しているフィルタ**:
- JobFiltersにステータスフィルタ（未応募/応募済み/面接中など）

#### 2. Phase 1: ピン留め・アーカイブ機能のUI
**plan.md Phase 1.4で定義されているが未実装**

**現状**:
- `isPinned`, `isArchived` はFirestoreに存在（`app/api/jobs/capture/route.ts`で保存）
- しかし、UIで操作不可
- コンポーネント内で使用されていない

**不足しているUI**:
- JobCardにピン/アーカイブボタン
- JobListでピン留めを最上部に表示
- JobFiltersにアーカイブフィルタ（アーカイブを非表示）

#### 3. Phase 3.8: UI表示とデータフローの修正（緊急対応）
**plan.md Phase 3.10で未解決問題として記録**

**問題1: URLが適当なダミーになってしまっている**
- 「元ページを開く」ボタンをクリックすると、正しいURLではなく適当なダミーURLに飛ぶ
- 調査が必要な箇所:
  - `chrome-extension/popup.js`の`getPageInfo()`関数
  - `app/api/jobs/capture/route.ts`のURLバリデーション処理
  - Firestoreに保存されている実際のURLデータ

**問題2: 特定企業に最適化されたロジックによる汎用性の欠如**
- freeeの求人で「エンジニアリング基盤本部：データアナリスト」と表示される（正しくは「フリー株式会社：データアナリスト」）
- `lib/parsers/jobExtractor.ts`に特定企業名のハードコードが存在
- 汎用的なパターンマッチングに変更が必要

#### 4. Phase 3.11: SmartHR・Sansanテスト結果と抽出ロジックの課題
**plan.md Phase 3.11で新規発見問題として記録**

**問題1: SmartHRの会社名が抽出できない**
- content内に「会社概要」セクションが存在しない
- freeeと同じロジックでは抽出できない
- ドメイン名（`smarthr.jp`）から会社名を推測するロジックが必要

**問題2: Sansanの会社名に余分な文字列が含まれている**
- 「Sansan株式会社 顧客の未来をリードする」と抽出される（期待値: 「Sansan株式会社」のみ）
- 除外キーワードの拡充が必要

**問題3: 年収の抽出が間違っている**
- SmartHR: `salaryMin: 50万円`, `salaryMax: 588万円`（期待値: `salaryMin: 588万円`, `salaryMax: 1,050万円`）
- Sansan: `salaryMin: 506万円`, `salaryMax: 801万円`（期待値: `salaryMin: 801万円`, `salaryMax: 1,506万円`）
- 「年収」「想定年収」キーワードの優先度向上が必要

---

## 🎯 推奨作業順序（優先順位順）

### 優先度1: Phase 1 - 応募ステータス管理の実装（5-6時間）

**理由**: plan.mdで最優先とされており、ユーザー価値が高い

**作業内容**:
1. **型定義の拡張**（30分）
   - `types/job.ts`に応募管理フィールドを追加
   - `app/api/jobs/capture/route.ts`でデフォルト値を設定

2. **JobCardにUI追加**（3-4時間）
   - 応募ステータスのドロップダウン
   - メモ入力欄
   - 評価の星アイコン
   - Firestore更新処理

3. **JobFiltersにステータスフィルタ追加**（1時間）
   - ステータスでフィルタリング機能

4. **テスト**（30分）
   - 動作確認
   - Firestore更新確認

### 優先度2: Phase 1 - ピン留め・アーカイブUI（2-3時間）

**理由**: plan.mdでPhase 1で定義されており、既にFirestoreにデータが存在

**作業内容**:
1. **JobCardにピン/アーカイブボタン追加**（1時間）
2. **JobListでピン留めを最上部に表示**（30分）
3. **JobFiltersにアーカイブフィルタ追加**（30分）
4. **テスト**（30分）

### 優先度3: Phase 3.8 - URL問題の調査と修正（2-3時間）

**理由**: 緊急対応が必要な問題として記録されている

**作業内容**:
1. **Firestoreのデータ確認**（30分）
   - 保存されているURLが正しいか確認
2. **Chrome拡張機能のURL取得処理確認**（1時間）
   - `chrome-extension/popup.js`の`getPageInfo()`関数を確認
3. **URLバリデーション処理の見直し**（1時間）
   - `app/api/jobs/capture/route.ts`のURLバリデーション処理を確認
4. **テスト**（30分）
   - Playwrightでリンククリック時の動作を確認

### 優先度4: Phase 3.11 - 抽出ロジックの改善（3-4時間）

**理由**: SmartHRとSansanのテスト結果で課題が発見されている

**作業内容**:
1. **会社名抽出の改善**（2時間）
   - SmartHRパターンへの対応（ドメイン名からの推測）
   - Sansanパターンへの対応（除外キーワードの拡充）
2. **年収抽出の改善**（1-2時間）
   - 「年収」「想定年収」キーワードの優先度向上
   - 説明文の数値の除外
3. **テスト**（30分）
   - SmartHRとSansanのテストケースで再テスト

### 優先度5: Phase 3.8 - 汎用性の欠如問題の根本的解決（3-4時間）

**理由**: 特定企業に最適化されたロジックによる汎用性の欠如

**作業内容**:
1. **特定企業名のハードコードを削除**（1時間）
   - `lib/parsers/jobExtractor.ts`から特定企業名パターンを削除
2. **汎用的なパターンマッチングに変更**（2時間）
   - 法人格（株式会社、合同会社等）を含む文字列を汎用的に抽出
3. **テスト**（1時間）
   - 再抽出APIを実行してFirestoreのデータを更新
   - ブラウザで確認

---

## 📋 実装チェックリスト

### Phase 1: 応募ステータス管理
- [ ] `types/job.ts`に応募管理フィールドを追加
- [ ] `app/api/jobs/capture/route.ts`でデフォルト値を設定
- [ ] `components/JobCard.tsx`に応募ステータスUIを追加
- [ ] `components/JobFilters.tsx`にステータスフィルタを追加
- [ ] 動作確認・テスト

### Phase 1: ピン留め・アーカイブUI
- [ ] `components/JobCard.tsx`にピン/アーカイブボタンを追加
- [ ] `components/JobList.tsx`でピン留めを最上部に表示
- [ ] `components/JobFilters.tsx`にアーカイブフィルタを追加
- [ ] 動作確認・テスト

### Phase 3.8: URL問題の調査と修正
- [ ] Firestoreのデータ確認
- [ ] Chrome拡張機能のURL取得処理確認
- [ ] URLバリデーション処理の見直し
- [ ] Playwrightでリンククリック時の動作確認

### Phase 3.11: 抽出ロジックの改善
- [ ] SmartHRパターンへの対応（ドメイン名からの推測）
- [ ] Sansanパターンへの対応（除外キーワードの拡充）
- [ ] 年収抽出の改善（「年収」「想定年収」キーワードの優先度向上）
- [ ] SmartHRとSansanのテストケースで再テスト

### Phase 3.8: 汎用性の欠如問題の根本的解決
- [ ] 特定企業名のハードコードを削除
- [ ] 汎用的なパターンマッチングに変更
- [ ] 再抽出APIを実行してFirestoreのデータを更新
- [ ] ブラウザで確認

---

## 💡 実装時の注意点

### 安全性・信頼性の最優先（ユーザールールより）
- **安全性チェックは最優先で維持する** - 機能追加時も既存の安全性を損なわない
- **信頼度90%未満の抽出は拒否する** - 曖昧な結果は受け入れない
- **複数マッチの検出時は即座に処理を停止** - 安全性のため手動確認を促す

### 開発手法の徹底（ユーザールールより）
- **小刻みなコミット** - 機能単位で細かくコミット
- **即座のテスト** - 変更後は必ずテスト実行
- **段階的デバッグ** - 各処理段階でconsole.logで状況確認

### プロジェクト理解の徹底（ユーザールールより）
- **既存のパターンマッチングロジックを理解してから修正** - 既存ロジックを壊さない
- **既存の正規化処理との整合性を確認** - 一貫性を保つ
- **複雑なコード解析にはSerena MCPを積極活用** - 深い理解のため

---

## 📝 次のアクション

1. **今すぐ**: Phase 1 - 応募ステータス管理の実装を開始
2. **次**: Phase 1 - ピン留め・アーカイブUIの実装
3. **その後**: Phase 3.8 - URL問題の調査と修正
4. **最後**: Phase 3.11 - 抽出ロジックの改善

---

## 🔗 関連ファイル

### 修正が必要なファイル
- `types/job.ts` - 型定義拡張
- `app/api/jobs/capture/route.ts` - デフォルト値追加
- `components/JobCard.tsx` - UI追加
- `components/JobList.tsx` - ピン留め表示ロジック
- `components/JobFilters.tsx` - フィルタ追加
- `lib/parsers/jobExtractor.ts` - 抽出ロジック改善
- `chrome-extension/popup.js` - URL取得処理確認

### 参考ドキュメント
- `plan.md` - 詳細な実装プラン
- `reference/job_seiri_data_design_v1.md` - データ設計ドキュメント
- `test-results/` - テスト結果（SmartHR、Sansan等）
