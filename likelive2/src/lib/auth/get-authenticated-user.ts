/**
 * リクエストから認証済みユーザーを取得するヘルパー
 * Bearer トークンと Cookie の両方に対応
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyGoogleToken } from "./google-token-verifier";
import { findUserBySubject } from "@/lib/services/user-service";
import { UnauthorizedError } from "@/lib/utils/errors";

export async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  let accessToken: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    accessToken = authHeader.substring(7);
  } else {
    const cookieStore = await cookies();
    accessToken = cookieStore.get("ll_accessToken")?.value;
  }

  if (!accessToken) {
    throw new UnauthorizedError("Authentication required");
  }

  const subject = await verifyGoogleToken(accessToken);
  if (!subject) {
    throw new UnauthorizedError("Invalid or expired token");
  }

  const user = await findUserBySubject(subject);
  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  return user;
}
