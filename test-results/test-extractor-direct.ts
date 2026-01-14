/**
 * 抽出ロジックの直接テスト
 */

import { extractJobData } from '../lib/parsers/jobExtractor';

const testCases = [
  {
    name: "SaaS企業の営業職",
    url: "https://example.com/jobs/sales",
    title: "【株式会社テックスタート】法人営業マネージャー募集",
    content: `採用企業情報
会社名: 株式会社テックスタート
業種: SaaS

募集要項
職種: 法人営業

仕事内容
当社のB2B SaaS製品の法人営業を担当していただきます。
新規開拓から既存顧客の拡大まで、営業活動全般を行います。
フィールドセールスとインサイドセールスの両方を経験できる環境です。

給与
年収: 500万円〜800万円
賞与: 年2回（業績に応じて変動）
昇給: 年1回

勤務地
東京都渋谷区
リモートワーク可（週3日程度）

応募資格
・法人営業経験3年以上
・コミュニケーション能力
・チームワークを大切にできる方

求める人物像
・自走力があり、目標達成に向けて努力できる方
・顧客第一の姿勢を持てる方
・SaaS業界に興味がある方`
  },
  {
    name: "HR企業のCS職",
    url: "https://hr-careers.com/jobs/cs",
    title: "カスタマーサクセスマネージャー | HRテック企業",
    content: `採用企業: HRソリューション株式会社
HRテック業界で人材紹介・採用支援サービスを提供しています。

募集職種
カスタマーサクセスマネージャー（CSM）

業務内容
・顧客オンボーディングの支援
・顧客満足度向上のための施策立案
・カスタマーサポート（B2B向け）
・リテンション施策の実行

報酬
想定年収: 600万円〜900万円
基本給: 月給40万円〜
各種手当: 交通費全額支給

就業場所
東京都港区
ハイブリッド勤務（在宅勤務あり）

必須要件
・カスタマーサクセス経験2年以上
・B2B SaaSの経験がある方歓迎
・タレントマネジメントに興味がある方

歓迎要件
・HRテック業界の経験
・適性検査ツールの知識`
  },
  {
    name: "コンサルティング企業",
    url: "https://consulting-firm.com/jobs/consultant",
    title: "戦略コンサルタント募集 | マネジメントコンサルティング",
    content: `企業名: グローバルコンサルティング株式会社
戦略コンサルティングファームです。

ポジション
DXコンサルタント

職務内容
・クライアント企業のDX戦略立案
・ITコンサルティング業務
・プロジェクトマネジメント
・経営戦略の提案

年収
700万円〜1200万円
（経験年数に応じて変動）

勤務地
東京都千代田区
原則出社（リモート勤務不可）

応募資格
・コンサルタント経験5年以上
・マネジメント経験がある方
・Big4経験者歓迎

必須スキル
・戦略立案能力
・プレゼンテーション能力
・プロジェクトマネジメントスキル`
  }
];

console.log("🧪 抽出ロジックの直接テスト\n");
console.log("=".repeat(80));

testCases.forEach((testCase, index) => {
  console.log(`\n📋 テストケース ${index + 1}: ${testCase.name}`);
  console.log("-".repeat(80));
  
  const result = extractJobData(testCase.url, testCase.title, testCase.content);
  
  console.log("\n📊 抽出結果:");
  console.log(`  会社名: ${result.companyName || "❌ 抽出失敗"}`);
  console.log(`  役職名: ${result.jobTitle || "❌ 抽出失敗"}`);
  console.log(`  年収: ${result.salaryMin ? `${Math.floor(result.salaryMin / 10000)}万円` : "❌"} ${result.salaryMax ? `〜${Math.floor(result.salaryMax / 10000)}万円` : ""}`);
  console.log(`  年収帯: ${result.salaryBand || "❌"}`);
  console.log(`  職種タグ: ${result.jobType || "❌"}`);
  console.log(`  業種タグ: ${result.industry || "❌"}`);
  console.log(`  職務内容: ${result.jobDescription ? `✅ (${result.jobDescription.length}文字)` : "❌"}`);
  console.log(`  求める人物像: ${result.requiredPerson ? `✅ (${result.requiredPerson.length}文字)` : "❌"}`);
  
  if (result.jobDescription) {
    console.log("\n📝 職務内容（最初の100文字）:");
    console.log(`  ${result.jobDescription.substring(0, 100)}...`);
  }
  
  if (result.requiredPerson) {
    console.log("\n👤 求める人物像（最初の100文字）:");
    console.log(`  ${result.requiredPerson.substring(0, 100)}...`);
  }
});

console.log("\n\n" + "=".repeat(80));
console.log("✅ テスト完了");
