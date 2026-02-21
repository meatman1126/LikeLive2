import { getGoogleUserInfo } from "@/lib/auth/google-service";
import { verifyGoogleToken } from "@/lib/auth/google-token-verifier";
import { env } from "@/lib/config/env";
import { findUserBySubject, registerUser } from "@/lib/services/user-service";
import { UnauthorizedError } from "@/lib/utils/errors";
import { NextRequest, NextResponse } from "next/server";

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
 * OAuthコールバックを処理するRoute Handler
 * Google認証コードをトークンに交換し、Cookieに保存します
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    // codeがない場合はルートページへリダイレクト
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    // OAuth認証コードをトークンに交換
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

    // トークンを検証
    const subject = await verifyGoogleToken(tokenData.access_token);
    if (!subject) {
      throw new UnauthorizedError("Invalid or expired token");
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

    // リダイレクトレスポンスにCookieを直接付与（返すレスポンスに乗せないと本番で失われることがある）
    const redirectResponse = NextResponse.redirect(new URL("/dashboard", request.url));
    const opts = cookieOptions();
    redirectResponse.cookies.set(ACCESS_TOKEN_COOKIE, tokenData.access_token, opts);
    redirectResponse.cookies.set(SUBJECT_COOKIE, subject, opts);
    if (tokenData.refresh_token) {
      redirectResponse.cookies.set(REFRESH_TOKEN_COOKIE, tokenData.refresh_token, opts);
    }
    if (typeof tokenData.expires_in === "number") {
      const expiresAt = Date.now() + tokenData.expires_in * 1000;
      redirectResponse.cookies.set(TOKEN_EXPIRES_AT_COOKIE, String(expiresAt), opts);
    }
    return redirectResponse;
  } catch (error) {
    console.error("OAuth callback error:", error);
    // エラー時はルートページへリダイレクト
    return NextResponse.redirect(new URL("/", request.url));
  }
}
