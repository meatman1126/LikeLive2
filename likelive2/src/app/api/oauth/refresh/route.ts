/**
 * Google OAuth トークンリフレッシュAPI
 */

import { createPostHandler } from "@/lib/utils/api-handler";
import { getRequestBody } from "@/lib/utils/request";
import { NextRequest } from "next/server";

interface RefreshRequest {
  refresh_token: string;
}

async function handler(req: NextRequest) {
  const body = await getRequestBody<RefreshRequest>(req);
  const { refresh_token } = body;

  if (!refresh_token) {
    throw new Error("Refresh token is required");
  }

  const { googleClientId, googleClientSecret } = await import(
    "@/lib/config/env"
  ).then((m) => m.env);

  if (!googleClientId || !googleClientSecret) {
    throw new Error("OAuth configuration is missing");
  }

  const params = new URLSearchParams();
  params.append("refresh_token", refresh_token);
  params.append("grant_type", "refresh_token");
  params.append("client_id", googleClientId);
  params.append("client_secret", googleClientSecret);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const tokenData = await response.json();
  return tokenData;
}

export const POST = createPostHandler(handler);
