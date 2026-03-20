import { NextRequest } from "next/server";
import { createGetHandler, createPostHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getPublishedBlogs, createBlog } from "@/lib/services/blog-service";
import { getQueryParam, getQueryParamAsNumber, getRequestBody } from "@/lib/utils/request";
import { BlogCategory } from "@prisma/client";

async function getHandler(req: NextRequest) {
  const page = getQueryParamAsNumber(req, "page") ?? 1;
  const limit = getQueryParamAsNumber(req, "limit") ?? 20;
  const category = getQueryParam(req, "category") as BlogCategory | null;
  return await getPublishedBlogs(page, limit, category || undefined);
}

async function postHandler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const body = await getRequestBody<{
    title: string;
    content: string;
    category: BlogCategory;
    status: string;
    artistIds?: string[];
  }>(req);
  return await createBlog(user.id, body as Parameters<typeof createBlog>[1], String(user.id));
}

export const GET = createGetHandler(getHandler);
export const POST = createPostHandler(postHandler);
