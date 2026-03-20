import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { findRepliesByParentCommentId } from "@/lib/services/comment-service";
import { getPathParamAsNumber } from "@/lib/utils/request";

async function handler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const parentId = await getPathParamAsNumber(params, "id");
  return await findRepliesByParentCommentId(parentId);
}

export const GET = createGetHandler(handler);
