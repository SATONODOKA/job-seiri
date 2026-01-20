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

// 環境変数の検証（警告のみ、初期化は試行する）
function validateFirebaseConfig(): boolean {
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
    const errorMsg = `Firebase環境変数が一部設定されていません: ${missingEnvVars.join(', ')}`;
    // 警告のみ（初期化は試行する）
    if (typeof window !== 'undefined') {
      console.warn('⚠️', errorMsg);
      console.warn('ブラウザ環境では環境変数が読み込まれていない可能性があります。');
    } else {
      console.warn('⚠️', errorMsg);
    }
    // 重要な環境変数（apiKey, projectId）がない場合はfalseを返す
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      return false;
    }
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

  // 環境変数の検証（警告のみ、初期化は試行する）
  const hasRequiredConfig = validateFirebaseConfig();
  
  // 必須環境変数がない場合は初期化を試みない
  // ただし、開発環境では環境変数がなくても動作するようにする
  if (!hasRequiredConfig) {
    // 開発環境では警告のみ、本番環境ではエラー
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Firebase初期化をスキップ: 必須環境変数（API_KEY, PROJECT_ID）が設定されていません');
      return { app: null, db: null, auth: null };
    } else {
      console.warn('⚠️ Firebase初期化を試行しますが、環境変数が不足しています。本番環境では設定が必要です。');
      // 開発環境では、環境変数がなくても初期化を試みる（エラーは後で発生する）
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

// 初期化を実行（サーバーサイドでは遅延初期化）
let initializedDb: Firestore | null = null;
let initializedAuth: Auth | null = null;

// サーバーサイドでは初期化をスキップ（クライアントサイドでのみ初期化）
if (typeof window !== 'undefined') {
  const result = initializeFirebase();
  initializedDb = result.db;
  initializedAuth = result.auth;
}

// エクスポート（nullの可能性があるため、使用時にチェックが必要）
export const db: Firestore | null = initializedDb;
export const auth: Auth | null = initializedAuth;
