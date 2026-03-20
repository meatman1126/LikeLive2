import { NextRequest } from "next/server";
import { createPutHandler, createDeleteHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { updateComment, deleteComment } from "@/lib/services/comment-service";
import { getPathParamAsNumber } from "@/lib/utils/request";
import { getRequestBody } from "@/lib/utils/request";

async function putHandler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const user = await getAuthenticatedUser(req);
  const id = await getPathParamAsNumber(params, "id");
  const body = await getRequestBody<{ content: string }>(req);
  return await updateComment(id, user.id, body.content, String(user.id));
}

async function deleteHandler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const user = await getAuthenticatedUser(req);
  const id = await getPathParamAsNumber(params, "id");
  await deleteComment(id, user.id, String(user.id));
  return { message: "Comment deleted" };
}

export const PUT = createPutHandler(putHandler);
export const DELETE = createDeleteHandler(deleteHandler);
