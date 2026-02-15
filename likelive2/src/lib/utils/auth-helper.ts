/**
 * 認証が必要なAPI Route用のヘルパー関数
 */

import { NextRequest } from 'next/server';
import { getCurrentUser, getCurrentUserId } from '../auth/user-context';
import { env } from '../config/env';

/**
 * 認証が必要なハンドラーをラップする
 * 認証に失敗した場合は自動的にエラーレスポンスを返す
 * 
 * @param handler 認証が必要なハンドラー関数
 * @returns ラップされたハンドラー
 */
export function withAuth<T>(
  handler: (req: NextRequest, user: Awaited<ReturnType<typeof getCurrentUser>>) => Promise<T>
) {
  return async (req: NextRequest) => {
    const user = await getCurrentUser(req);
    return handler(req, user);
  };
}

/**
 * 認証が必要なハンドラーをラップする（ユーザーIDのみ必要）
 * 
 * @param handler 認証が必要なハンドラー関数（ユーザーIDを受け取る）
 * @returns ラップされたハンドラー
 */
export function withAuthUserId<T>(
  handler: (req: NextRequest, userId: number) => Promise<T>
) {
  return async (req: NextRequest) => {
    const userId = await getCurrentUserId(req);
    return handler(req, userId);
  };
}

/**
 * Google認証URLを生成する
 * @returns Google OAuth認証URL
 */
export function buildGoogleAuthUrl() {
  const params = new URLSearchParams();
  params.set("client_id", env.googleClientId);
  params.set("redirect_uri", env.oauthRedirectUri);
  params.set("response_type", "code");
  params.set("scope", "openid email profile");
  params.set("access_type", "offline");
  params.set("prompt", "consent");
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

