// Firebase設定のテンプレート
// このファイルをコピーして config.js を作成し、実際の値を設定してください
// config.js は .gitignore に追加されているため、Gitにコミットされません

const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

// API URL設定
// 開発環境: http://localhost:3001/api/jobs/capture
// 本番環境: https://kyujin-bookmark.netlify.app/api/jobs/capture
// 注意: 本番環境で使用する場合は、Netlifyの実際のURLに変更してください
const API_URL = "https://kyujin-bookmark.netlify.app/api/jobs/capture";

// グローバル変数としてエクスポート(Chrome拡張機能用)
if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
  window.API_URL = API_URL;
}
