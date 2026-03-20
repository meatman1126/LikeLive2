import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getPublicRecommendedBlogs } from "@/lib/services/blog-service";
import { getQueryParamAsNumber } from "@/lib/utils/request";

async function handler(req: NextRequest) {
  const limit = getQueryParamAsNumber(req, "limit") ?? 10;
  return await getPublicRecommendedBlogs(limit);
}

export const GET = createGetHandler(handler);
