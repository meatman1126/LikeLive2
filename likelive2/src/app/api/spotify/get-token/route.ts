/**
 * Spotifyトークン取得
 */

import { getAccessToken } from "@/lib/services/spotify-service";
import { createGetHandler } from "@/lib/utils/api-handler";
import { NextRequest } from "next/server";

/**
 * Spotifyアクセストークンを取得します。
 */
async function handler(req: NextRequest) {
  return getAccessToken();
}

export const GET = createGetHandler(handler);
