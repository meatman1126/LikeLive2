import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { findCommentsByBlogId } from "@/lib/services/comment-service";
import { getPathParamAsNumber } from "@/lib/utils/request";

async function handler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const blogId = await getPathParamAsNumber(params, "id");
  return await findCommentsByBlogId(blogId);
}

export const GET = createGetHandler(handler);
