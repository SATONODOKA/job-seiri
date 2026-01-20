# サービス機能フロー分析

## 全体フロー

```
[1] Chrome拡張機能
    ↓ (POST /api/jobs/capture)
[2] API Route (app/api/jobs/capture/route.ts)
    ↓
[3] ルールベース抽出 (extractJobData)
    ↓
[4] LLM処理 (refineWithGemini)
    ↓
[5] Firestore保存
    ↓
[6] レスポンス返却
```

## 各段階の詳細

### [1] Chrome拡張機能 (popup.js)
- **入力**: ユーザーが「この求人を保存」をクリック
- **処理**: 
  - ページ情報を取得 (getPageInfo)
  - API呼び出し (saveToFirestore)
- **出力**: { url, title, content }

### [2] API Route (app/api/jobs/capture/route.ts)
- **入力**: { url, title, content }
- **処理**:
  1. URLバリデーション
  2. Firebase初期化確認
  3. ルールベース抽出
  4. LLM処理
  5. Firestore保存
- **出力**: { success: true, id: docRef.id }

### [3] ルールベース抽出 (extractJobData)
- **入力**: url, title, content
- **処理**: パターンマッチングで抽出
- **出力**: ExtractedJobData

### [4] LLM処理 (refineWithGemini)
- **入力**: ruleBasedResult, url, title, content
- **処理**:
  1. APIキー確認
  2. Gemini API呼び出し
  3. レスポンスパース
  4. ルールベース結果とマージ
- **出力**: ExtractedJobData (LLM整形後)

### [5] Firestore保存
- **入力**: extractedData
- **処理**: Firestoreに保存
- **出力**: docRef.id

## 問題の可能性

1. **LLM処理が実行されていない**
   - APIキーが設定されていない
   - genAIがnull
   - エラーが発生してフォールバック

2. **LLM処理は実行されているが、結果が変わらない**
   - LLMがルールベースと同じ結果を返している
   - パースエラーでフォールバック

3. **LLM処理は実行されているが、結果が保存されていない**
   - Firestore保存時に問題がある
