/**
 * レート制限機能（Firestoreカウンタ方式）
 * サーバレス環境（Netlify）でも動作するように、Firestoreを使用
 * 
 * 注意: 本番環境ではUpstash Redisの使用を推奨
 */

import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * レート制限をチェック
 * @param key レート制限のキー（例: "rate_limit:userId"）
 * @param limit 制限数（デフォルト: 10）
 * @param windowMs 時間窓（ミリ秒、デフォルト: 60000 = 1分）
 * @returns レート制限の結果
 */
export async function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  if (!db) {
    // Firebaseが初期化されていない場合は許可（開発環境でのフォールバック）
    console.warn("Firebase not initialized, allowing request");
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };
  }

  const now = Date.now();
  const rateLimitDoc = doc(db, "rateLimits", key);

  try {
    const snapshot = await getDoc(rateLimitDoc);

    if (!snapshot.exists()) {
      // 新しいレート制限レコードを作成
      await setDoc(rateLimitDoc, {
        count: 1,
        resetAt: now + windowMs,
        createdAt: now,
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
      };
    }

    const data = snapshot.data();
    const resetAt = data.resetAt || now + windowMs;
    const count = data.count || 0;

    // 時間窓が過ぎている場合はリセット
    if (now > resetAt) {
      await updateDoc(rateLimitDoc, {
        count: 1,
        resetAt: now + windowMs,
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
      };
    }

    // レート制限に達している場合
    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: resetAt,
      };
    }

    // カウントを増やす
    await updateDoc(rateLimitDoc, {
      count: count + 1,
    });

    return {
      allowed: true,
      remaining: limit - (count + 1),
      resetAt: resetAt,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // エラーが発生した場合は許可（フォールバック）
    return {
      allowed: true,
      remaining: limit,
      resetAt: now + windowMs,
    };
  }
}
