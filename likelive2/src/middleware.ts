import { verifyGoogleToken } from "@/lib/auth/google-token-verifier";
import { NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "ll_accessToken";
const REFRESH_TOKEN_COOKIE = "ll_refreshToken";
const TOKEN_EXPIRES_AT_COOKIE = "ll_tokenExpiresAt";
const SUBJECT_COOKIE = "ll_subject";

/**
 * 認証が必要なページのパスパターン
 */
const protectedPaths = [
  "/me",
  "/dashboard",
  "/user",
  "/blog/create",
  "/blog/edit",
];

/**
 * 認証が不要なページのパスパターン（公開ページ）
 */
const publicPaths = [
  "/",
  "/login",
  "/blog/search",
  "/privacy",
  "/term",
  "/api",
];

/**
 * パスが保護されたパスに該当するかチェック
 */
function isProtectedPath(pathname: string): boolean {
  // 公開パスをチェック（完全一致または前方一致）
  for (const publicPath of publicPaths) {
    if (pathname === publicPath || pathname.startsWith(`${publicPath}/`)) {
      return false;
    }
  }

  // 保護されたパスをチェック（完全一致または前方一致）
  for (const protectedPath of protectedPaths) {
    if (
      pathname === protectedPath ||
      pathname.startsWith(`${protectedPath}/`)
    ) {
      return true;
    }
  }

  // デフォルトは公開（ブログ詳細ページなど）
  return false;
}

/**
 * Cookieからアクセストークンを取得
 */
function getAccessTokenFromCookie(request: NextRequest): string | null {
  const cookie = request.cookies.get(ACCESS_TOKEN_COOKIE);
  return cookie?.value || null;
}

/**
 * Cookieからリフレッシュトークンを取得
 */
function getRefreshTokenFromCookie(request: NextRequest): string | null {
  const cookie = request.cookies.get(REFRESH_TOKEN_COOKIE);
  return cookie?.value || null;
}

/**
 * トークンの有効期限をチェック（事前チェック用）
 * 有効期限が切れている、または切れそうな場合はfalseを返す
 */
function isTokenExpiredOrExpiringSoon(request: NextRequest): boolean {
  const expiresAtCookie = request.cookies.get(TOKEN_EXPIRES_AT_COOKIE);
  if (!expiresAtCookie?.value) {
    // 有効期限情報がない場合は、検証が必要と判断
    return true;
  }

  const expiresAt = parseInt(expiresAtCookie.value, 10);
  if (isNaN(expiresAt)) {
    return true;
  }

  // 現在時刻より5分以上前の場合は、有効期限切れまたは切れそうと判断
  // 5分のマージンを設けることで、期限ギリギリでのAPI呼び出しを避ける
  const now = Date.now();
  const margin = 5 * 60 * 1000; // 5分（ミリ秒）
  return now >= expiresAt - margin;
}

/**
 * Cookieオプションを生成
 */
function cookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
  };
}

/**
 * リフレッシュトークンを使ってアクセストークンを更新
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in?: number;
} | null> {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
      console.error("Google OAuth credentials are missing");
      return null;
    }

    const params = new URLSearchParams();
    params.append("client_id", googleClientId);
    params.append("client_secret", googleClientSecret);
    params.append("refresh_token", refreshToken);
    params.append("grant_type", "refresh_token");

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to refresh token:", errorText);
      return null;
    }

    const tokenData = (await response.json()) as {
      access_token: string;
      expires_in?: number;
      scope?: string;
      token_type?: string;
      id_token?: string;
    };

    if (!tokenData.access_token) {
      console.error("Google refresh response missing access_token");
      return null;
    }

    return {
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
    };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

/**
 * トークンを検証し、subject を返す
 */
async function verifyToken(token: string): Promise<string | null> {
  try {
    return await verifyGoogleToken(token);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保護されたパスでない場合はそのまま通過
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // Cookieからアクセストークンを取得
  const accessToken = getAccessTokenFromCookie(request);

  // トークンが存在しない場合はルートページにリダイレクト
  if (!accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 有効期限を事前チェック（最適化）
  // 有効期限が切れていない場合は、トークン検証をスキップして通過
  if (!isTokenExpiredOrExpiringSoon(request)) {
    return NextResponse.next();
  }

  // トークンを検証
  const subject = await verifyToken(accessToken);

  // トークンが有効な場合は subject Cookie を設定して通過
  if (subject) {
    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.next();
    response.cookies.set(SUBJECT_COOKIE, subject, cookieOptions(isProduction));
    return response;
  }

  // トークンが無効な場合、リフレッシュトークンで更新を試みる
  const refreshToken = getRefreshTokenFromCookie(request);
  if (!refreshToken) {
    // リフレッシュトークンがない場合はルートページにリダイレクト
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const response = NextResponse.redirect(url);
    // 無効なアクセストークンのCookieを削除
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(TOKEN_EXPIRES_AT_COOKIE);
    return response;
  }

  // リフレッシュトークンでアクセストークンを更新
  const newTokenData = await refreshAccessToken(refreshToken);
  if (!newTokenData) {
    // リフレッシュに失敗した場合はルートページにリダイレクト
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const response = NextResponse.redirect(url);
    // すべての認証関連のCookieを削除
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    response.cookies.delete(TOKEN_EXPIRES_AT_COOKIE);
    return response;
  }

  // 新しいトークンを検証
  const newSubject = await verifyToken(newTokenData.access_token);
  if (!newSubject) {
    // 新しいトークンも無効な場合はルートページにリダイレクト
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const response = NextResponse.redirect(url);
    // すべての認証関連のCookieを削除
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    response.cookies.delete(TOKEN_EXPIRES_AT_COOKIE);
    return response;
  }

  // 新しいトークンでリクエストを続行
  const isProductionEnv = process.env.NODE_ENV === "production";
  const response = NextResponse.next();

  // 新しいアクセストークンをCookieに設定
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    newTokenData.access_token,
    cookieOptions(isProductionEnv)
  );

  // subject CookieをCookieに設定
  response.cookies.set(
    SUBJECT_COOKIE,
    newSubject,
    cookieOptions(isProductionEnv)
  );

  // 有効期限をCookieに設定
  if (typeof newTokenData.expires_in === "number") {
    const expiresAt = Date.now() + newTokenData.expires_in * 1000;
    response.cookies.set(
      TOKEN_EXPIRES_AT_COOKIE,
      String(expiresAt),
      cookieOptions(isProductionEnv)
    );
  }

  return response;
}

/**
 * ミドルウェアを適用するパスを指定
 */
export const config = {
  matcher: [
    /*
     * 以下のパスを除くすべてのリクエストパスにマッチ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|login/callback).*)",
  ],
};
