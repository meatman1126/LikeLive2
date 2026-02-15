/**
 * Server Actions用の認証ヘルパー
 *
 * Server Actionsから認証情報を取得するためのユーティリティ
 */

import type { User } from "@/generated/prisma/client";
import { cookies, headers } from "next/headers";
import { findUserBySubject } from "../services/user-service";
import { NotFoundError, UnauthorizedError } from "../utils/errors";
import { verifyGoogleToken } from "./google-token-verifier";

export interface AuthContext {
  subject: string;
  userId?: number;
}

const ACCESS_TOKEN_COOKIE = "ll_accessToken";

/**
 * Server Actionsから認証情報を取得
 *
 * @returns 認証情報（subject）
 * @throws UnauthorizedError 認証に失敗した場合
 */
export async function getAuthContextFromHeaders(): Promise<AuthContext> {
  // 優先: httpOnly Cookie（Server Actions推奨）
  const cookieStore = await cookies();
  const accessTokenFromCookie = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessTokenFromCookie) {
    const subject = await verifyGoogleToken(accessTokenFromCookie);
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
