"use server";

/**
 * Auth関連のServer Actions（httpOnly Cookie運用）
 */

import { getGoogleUserInfo } from "@/lib/auth/google-service";
import { verifyGoogleToken } from "@/lib/auth/google-token-verifier";
import { env } from "@/lib/config/env";
import { findUserBySubject, registerUser } from "@/lib/services/user-service";
import { buildGoogleAuthUrl } from "@/lib/utils/auth-helper";
import { UnauthorizedError, ValidationError } from "@/lib/utils/errors";
import { cookies } from "next/headers";

const ACCESS_TOKEN_COOKIE = "ll_accessToken";
const REFRESH_TOKEN_COOKIE = "ll_refreshToken";
const TOKEN_EXPIRES_AT_COOKIE = "ll_tokenExpiresAt"; // epoch ms
const SUBJECT_COOKIE = "ll_subject";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.isProduction,
    path: "/",
  };
}

/**
 * OAuth認証コードをトークンに交換し、Cookieに保存した上でユーザーを返します。
 *
 * - 初回ログイン時はDBにユーザーを自動登録します。
 */
export async function loginWithGoogleCodeAction(code: string) {
  if (!code || typeof code !== "string") {
    throw new ValidationError("Code is required");
  }

  const params = new URLSearchParams();
  params.append("code", code);
  params.append("client_id", env.googleClientId);
  params.append("client_secret", env.googleClientSecret);
  params.append("redirect_uri", env.oauthRedirectUri);
  params.append("grant_type", "authorization_code");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new UnauthorizedError(
      `Failed to exchange code for token: ${errorText}`
    );
  }

  const tokenData = (await response.json()) as {
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    id_token?: string;
  };

  if (!tokenData.access_token) {
    throw new UnauthorizedError("Google token response missing access_token");
  }

  const subject = await verifyGoogleToken(tokenData.access_token);
  if (!subject) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  // Cookie保存
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, tokenData.access_token, cookieOptions());
  store.set(SUBJECT_COOKIE, subject, cookieOptions());

  if (tokenData.refresh_token) {
    store.set(REFRESH_TOKEN_COOKIE, tokenData.refresh_token, cookieOptions());
  }

  if (typeof tokenData.expires_in === "number") {
    const expiresAt = Date.now() + tokenData.expires_in * 1000;
    store.set(TOKEN_EXPIRES_AT_COOKIE, String(expiresAt), cookieOptions());
  }

  // ユーザー取得/初回登録
  let user = await findUserBySubject(subject);
  if (!user) {
    const googleUserInfo = await getGoogleUserInfo(tokenData.access_token);
    user = await registerUser(
      subject,
      googleUserInfo.given_name || googleUserInfo.name || undefined
    );
  }

  return { user };
}

/**
 * リフレッシュトークンでアクセストークンを更新し、Cookieを更新します。
 */
export async function refreshGoogleAccessTokenAction() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    throw new UnauthorizedError("Refresh token is missing");
  }

  const params = new URLSearchParams();
  params.append("client_id", env.googleClientId);
  params.append("client_secret", env.googleClientSecret);
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new UnauthorizedError(`Failed to refresh token: ${errorText}`);
  }

  const tokenData = (await response.json()) as {
    access_token: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
    id_token?: string;
  };

  if (!tokenData.access_token) {
    throw new UnauthorizedError("Google refresh response missing access_token");
  }

  store.set(ACCESS_TOKEN_COOKIE, tokenData.access_token, cookieOptions());
  if (typeof tokenData.expires_in === "number") {
    const expiresAt = Date.now() + tokenData.expires_in * 1000;
    store.set(TOKEN_EXPIRES_AT_COOKIE, String(expiresAt), cookieOptions());
  }

  return { success: true };
}

/**
 * ログアウト（Cookie削除）
 */
export async function logoutAction() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
  store.delete(TOKEN_EXPIRES_AT_COOKIE);
  store.delete(SUBJECT_COOKIE);
  // <form action={logoutAction}> の要件に合わせて戻り値はvoidにする
}

/**
 * Google認証URLを取得します。
 * @returns Google OAuth認証URL
 */
export async function getGoogleAuthUrlAction() {
  return buildGoogleAuthUrl();
}
