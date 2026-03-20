import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getPublicRecommendedBlogs } from "@/lib/services/blog-service";
import { getQueryParamAsNumber } from "@/lib/utils/request";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

async function handler(req: NextRequest) {
  const limit = getQueryParamAsNumber(req, "limit") ?? 10;
  let excludeUserId: number | undefined;
  try {
    const user = await getAuthenticatedUser(req);
    excludeUserId = user.id;
  } catch {}
  return await getPublicRecommendedBlogs(limit, excludeUserId);
}

export const GET = createGetHandler(handler);
