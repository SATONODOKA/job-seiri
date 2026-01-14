#!/bin/bash

API_URL="http://localhost:3001/api/jobs/capture"

echo "🧪 実際の求人データでのテスト開始"
echo ""

# テストケース1: freee データアナリスト
echo "📋 テストケース1: freee データアナリスト"
echo "─────────────────────────────────────────────────────────"

# freeeのデータを読み込む
FREE_CONTENT=$(cat reference/test.freee.md | jq -Rs .)

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"https://herp.careers/v1/freee/jobs/analytics\",
    \"title\": \"【エンジニアリング基盤本部】データアナリスト\",
    \"content\": $(echo "$FREE_CONTENT" | jq -r .)
  }" | jq '.'

echo ""
echo ""

# テストケース2: デロイト コンサルタント
echo "📋 テストケース2: デロイト コンサルタント"
echo "─────────────────────────────────────────────────────────"

DELOITTE_CONTENT=$(cat reference/test.deloitte.md | jq -Rs .)

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"https://deloitte.com/jobs/consulting\",
    \"title\": \"合同会社デロイト トーマツ／コンサルティング Energy & Chemicals, Mining & Metals（エネルギー、素材化学、鉄鋼領域）\",
    \"content\": $(echo "$DELOITTE_CONTENT" | jq -r .)
  }" | jq '.'

echo ""
echo ""

# テストケース3: マネーフォワード プロダクトデザイナー
echo "📋 テストケース3: マネーフォワード プロダクトデザイナー"
echo "─────────────────────────────────────────────────────────"

MF_CONTENT=$(cat reference/test.moneyforward.md | jq -Rs .)

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"https://moneyforward.com/careers/product-designer\",
    \"title\": \"【プロダクトデザイナー（UI/UX）_オープンポジション】_東京（田町）\",
    \"content\": $(echo "$MF_CONTENT" | jq -r .)
  }" | jq '.'

echo ""
echo ""
echo "✅ テスト完了"
echo "ブラウザで http://localhost:3001 を開いて結果を確認してください"
