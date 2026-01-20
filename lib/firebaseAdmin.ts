/**
 * Firebase Admin SDK（サーバーサイド用）
 * IDトークンの検証に使用
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

function initializeAdmin() {
  if (adminApp) {
    return { app: adminApp, auth: adminAuth };
  }

  // 環境変数の確認
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccount) {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEYが設定されていません。IDトークン検証ができません。');
    return { app: null, auth: null };
  }

  try {
    // 既に初期化済みの場合はスキップ
    adminApp = getApps().length === 0 
      ? initializeApp({
          credential: cert(JSON.parse(serviceAccount)),
        })
      : getApps()[0];
    
    adminAuth = getAuth(adminApp);
    
    console.log('✅ Firebase Admin initialized');
    return { app: adminApp, auth: adminAuth };
  } catch (error) {
    console.error('❌ Firebase Admin初期化エラー:', error);
    return { app: null, auth: null };
  }
}

const result = initializeAdmin();
export const adminAuthInstance: Auth | null = result.auth;

/**
 * Firebase IDトークンを検証してユーザーIDを取得
 * @param idToken Firebase IDトークン
 * @returns ユーザーID（検証失敗時はnull）
 */
export async function verifyIdToken(idToken: string): Promise<string | null> {
  if (!adminAuthInstance) {
    console.warn('⚠️ Firebase Admin Authが初期化されていません。');
    return null;
  }

  try {
    const decodedToken = await adminAuthInstance.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('IDトークン検証エラー:', error);
    return null;
  }
}
