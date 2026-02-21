/**
 * Server Actions用の認証ヘルパー
 *
 * Server Actionsから認証情報を取得するためのユーティリティ。
 * パフォーマンス最適化: ll_subject Cookie が存在しトークン有効期限内なら
 * Google API を呼ばずに subject を返す（高速パス）。
 */

import type { User } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { findUserBySubject } from "../services/user-service";
import { NotFoundError, UnauthorizedError } from "../utils/errors";
import { verifyGoogleToken } from "./google-token-verifier";

export interface AuthContext {
  subject: string;
  userId?: number;
}

const ACCESS_TOKEN_COOKIE = "ll_accessToken";
const SUBJECT_COOKIE = "ll_subject";
const TOKEN_EXPIRES_AT_COOKIE = "ll_tokenExpiresAt";

/**
 * トークン有効期限が切れていないかチェック
 */
function isTokenStillValid(expiresAtValue: string | undefined): boolean {
  if (!expiresAtValue) return false;
  const expiresAt = parseInt(expiresAtValue, 10);
  if (isNaN(expiresAt)) return false;
  return Date.now() < expiresAt;
}

/**
 * Server Actionsから認証情報を取得
 *
 * @returns 認証情報（subject）
 * @throws UnauthorizedError 認証に失敗した場合
 */
export async function getAuthContextFromHeaders(): Promise<AuthContext> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const subjectCookie = cookieStore.get(SUBJECT_COOKIE)?.value;
  const expiresAt = cookieStore.get(TOKEN_EXPIRES_AT_COOKIE)?.value;

  // 高速パス: subject Cookie があり、トークンが有効期限内ならば Google API をスキップ
  if (accessToken && subjectCookie && isTokenStillValid(expiresAt)) {
    return { subject: subjectCookie };
  }

  // 通常パス: Google API で検証（インメモリキャッシュあり）
  if (accessToken) {
    const subject = await verifyGoogleToken(accessToken);
    if (!subject) {
      throw new UnauthorizedError("Invalid or expired token");
    }
    return { subject };
  }

  // フォールバック: Authorizationヘッダー（既存実装互換）
  const headersList = await headers();
  const authHeader = headersList.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authorization header is missing or invalid");
  }

  const token = authHeader.substring(7);
  const subject = await verifyGoogleToken(token);

  if (!subject) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  return { subject };
}

/**
 * Server Actionsから現在のユーザーを取得
 * 認証に失敗した場合はエラーを投げる
 *
 * @returns 現在のユーザー情報
 * @throws UnauthorizedError 認証に失敗した場合
 * @throws NotFoundError ユーザーが見つからない場合
 */
export async function getCurrentUserFromHeaders(): Promise<User> {
  const { subject } = await getAuthContextFromHeaders();

  const user = await findUserBySubject(subject);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}

/**
 * Server Actionsから現在のユーザーIDを取得
 *
 * @returns 現在のユーザーID
 */
export async function getCurrentUserIdFromHeaders(): Promise<number> {
  const user = await getCurrentUserFromHeaders();
  return user.id;
}
