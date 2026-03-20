import { NextRequest } from "next/server";
import { createPostHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createComment } from "@/lib/services/comment-service";
import { getRequestBody } from "@/lib/utils/request";

async function handler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const body = await getRequestBody<{
    blogId: number;
    content: string;
    parentCommentId?: number | null;
  }>(req);
  return await createComment(user.id, body.blogId, body.content, body.parentCommentId ?? null, String(user.id));
}

export const POST = createPostHandler(handler);
