/**
 * 抽出ロジックのテストスクリプト
 */

const testCases = [
  {
    name: "SaaS企業の営業職",
    url: "https://example.com/jobs/sales",
    title: "【株式会社テックスタート】法人営業マネージャー募集",
    content: `
採用企業情報
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
・SaaS業界に興味がある方
    `.trim()
  },
  {
    name: "HR企業のCS職",
    url: "https://hr-careers.com/jobs/cs",
    title: "カスタマーサクセスマネージャー | HRテック企業",
    content: `
採用企業: HRソリューション株式会社
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
・適性検査ツールの知識
    `.trim()
  },
  {
    name: "コンサルティング企業",
    url: "https://consulting-firm.com/jobs/consultant",
    title: "戦略コンサルタント募集 | マネジメントコンサルティング",
    content: `
企業名: グローバルコンサルティング株式会社
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
・プロジェクトマネジメントスキル
    `.trim()
  },
  {
    name: "年収表記が複雑なケース",
    url: "https://example.com/jobs/complex-salary",
    title: "プロダクトマネージャー（PdM）募集",
    content: `
会社名: スタートアップ株式会社
SaaSスタートアップでクラウドサービスを提供しています。

職種
プロダクトマネージャー（PdM）

業務概要
・プロダクト開発のマネジメント
・プロダクトオーナーとしての業務
・エンジニアチームとの連携

給与・待遇
基本給: 月給50万円
賞与: 年2回（基本給の3ヶ月分）
想定年収: 900万円以上
交通費: 実費支給（上限3万円/月）
福利厚生: 各種保険完備

勤務地
東京都新宿区
フルリモート可

求める人物像
・プロダクトマネジメント経験3年以上
・SaaS業界の経験
・技術的なバックグラウンドがある方
    `.trim()
  }
];

// 抽出ロジックをインポート（Node.js環境で実行する場合）
async function testExtraction() {
  // 実際のAPIエンドポイントに送信してテスト
  const API_URL = "http://localhost:3001/api/jobs/capture";
  
  console.log("🧪 抽出ロジックのテスト開始\n");
  
  for (const testCase of testCases) {
    console.log(`\n📋 テストケース: ${testCase.name}`);
    console.log("─".repeat(50));
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: testCase.url,
          title: testCase.title,
          content: testCase.content
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error("❌ エラー:", error);
        continue;
      }
      
      const result = await response.json();
      console.log("✅ 保存成功, ID:", result.id);
      
      // 抽出結果を確認するため、少し待ってから取得
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error("❌ リクエストエラー:", error.message);
    }
  }
  
  console.log("\n\n✅ テスト完了");
  console.log("ブラウザで http://localhost:3001 を開いて結果を確認してください");
}

// 直接実行（Node.js環境）
if (typeof require !== 'undefined') {
  // Node.js環境
  const fetch = require('node-fetch');
  testExtraction().catch(console.error);
} else {
  // ブラウザ環境
  console.log("ブラウザのコンソールで実行してください");
}
