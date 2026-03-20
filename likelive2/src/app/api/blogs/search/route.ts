import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { searchBlogs, searchBlogsByArtistName } from "@/lib/services/blog-service";
import { getQueryParam, getQueryParamAsNumber } from "@/lib/utils/request";
import { BlogCategory } from "@prisma/client";

async function handler(req: NextRequest) {
  const keyword = getQueryParam(req, "keyword") || "";
  const artistName = getQueryParam(req, "artistName");
  const page = getQueryParamAsNumber(req, "page") ?? 1;
  const limit = getQueryParamAsNumber(req, "limit") ?? 20;
  const category = getQueryParam(req, "category") as BlogCategory | null;

  if (artistName) {
    return await searchBlogsByArtistName(artistName, page, limit);
  }
  return await searchBlogs(keyword, page, limit, category || undefined);
}

export const GET = createGetHandler(handler);
