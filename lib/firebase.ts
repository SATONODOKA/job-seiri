import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 環境変数の検証
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error('❌ Firebase環境変数が設定されていません:', missingEnvVars);
  if (typeof window !== 'undefined') {
    console.error('ブラウザ環境では環境変数が読み込まれていません。Netlifyの環境変数設定を確認してください。');
  }
}

// デバッグ: Firebase設定を確認（機密情報はマスク）
if (typeof window !== 'undefined') {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : '未設定',
    authDomain: firebaseConfig.authDomain || '未設定',
    projectId: firebaseConfig.projectId || '未設定',
    storageBucket: firebaseConfig.storageBucket || '未設定',
    messagingSenderId: firebaseConfig.messagingSenderId || '未設定',
    appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 10)}...` : '未設定',
  });
}

// 重複初期化を防ぐ
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  console.log('✅ Firebase App initialized:', app.name);
} catch (error) {
  console.error('❌ Firebase初期化エラー:', error);
  throw new Error('Firebaseの初期化に失敗しました。環境変数を確認してください。');
}

export const db = getFirestore(app);
export const auth = getAuth(app);

// Auth設定の確認
if (auth) {
  console.log('✅ Firebase Auth initialized');
  // ネットワークエラー対策: タイムアウト設定
  auth.settings.appVerificationDisabledForTesting = false;
} else {
  console.error('❌ Firebase Authの初期化に失敗しました');
}
