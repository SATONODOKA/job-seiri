// マネーフォワードのデータで抽出をテスト
const testData = {
  url: 'https://moneyforward.com/careers/product-designer',
  title: '【プロダクトデザイナー（UI/UX）_オープンポジション】_東京（田町）',
  content: require('fs').readFileSync('./reference/test.moneyforward.md', 'utf-8')
};

fetch('http://localhost:3001/api/jobs/extract-on-client', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(res => res.json())
.then(data => {
  console.log('抽出結果:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(err => console.error('エラー:', err));
