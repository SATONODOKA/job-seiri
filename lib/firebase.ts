import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 環境変数の検証（ビルド時エラーを防ぐため、実行時のみチェック）
function validateFirebaseConfig() {
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
    const errorMsg = `Firebase環境変数が設定されていません: ${missingEnvVars.join(', ')}`;
    if (typeof window !== 'undefined') {
      console.error('❌', errorMsg);
      console.error('ブラウザ環境では環境変数が読み込まれていません。Netlifyの環境変数設定を確認してください。');
    } else {
      console.error('❌', errorMsg);
    }
    return false;
  }
  return true;
}

// Firebase初期化（エラーを投げずに安全に初期化）
let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

function initializeFirebase() {
  // 既に初期化済みの場合はスキップ
  if (app) {
    return { app, db: dbInstance, auth: authInstance };
  }

  // 環境変数の検証
  if (!validateFirebaseConfig()) {
    // ビルド時にはエラーを投げない（実行時にエラーを表示）
    if (typeof window === 'undefined') {
      // サーバーサイド: 環境変数がない場合はnullを返す
      return { app: null, db: null, auth: null };
    }
  }

  try {
    // 重複初期化を防ぐ
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    if (typeof window === 'undefined') {
      // サーバーサイド: ログを最小限に
      console.log('✅ Firebase App initialized (server)');
    } else {
      // クライアントサイド: デバッグ情報を表示
      console.log('✅ Firebase App initialized (client)');
      console.log('Firebase Config:', {
        apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : '未設定',
        authDomain: firebaseConfig.authDomain || '未設定',
        projectId: firebaseConfig.projectId || '未設定',
      });
    }

    dbInstance = getFirestore(app);
    authInstance = getAuth(app);

    if (authInstance) {
      if (typeof window !== 'undefined') {
        console.log('✅ Firebase Auth initialized');
      }
      authInstance.settings.appVerificationDisabledForTesting = false;
    }
  } catch (error) {
    console.error('❌ Firebase初期化エラー:', error);
    // ビルド時にはエラーを投げない
    if (typeof window !== 'undefined') {
      // クライアントサイドでのみエラーを表示
      console.error('Firebaseの初期化に失敗しました。環境変数を確認してください。');
    }
    return { app: null, db: null, auth: null };
  }

  return { app, db: dbInstance, auth: authInstance };
}

// 初期化を実行
const { db: initializedDb, auth: initializedAuth } = initializeFirebase();

// エクスポート（nullの可能性があるため、使用時にチェックが必要）
export const db: Firestore | null = initializedDb;
export const auth: Auth | null = initializedAuth;
