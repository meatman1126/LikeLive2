import { NextRequest } from "next/server";
import { createGetHandler, createPostHandler, createDeleteHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { likeBlog, unlikeBlog, isLiked } from "@/lib/services/like-service";
import { getPathParamAsNumber } from "@/lib/utils/request";

async function getHandler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const user = await getAuthenticatedUser(req);
  const blogId = await getPathParamAsNumber(params, "id");
  const liked = await isLiked(user.id, blogId);
  return { liked };
}

async function postHandler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const user = await getAuthenticatedUser(req);
  const blogId = await getPathParamAsNumber(params, "id");
  return await likeBlog(user.id, blogId, String(user.id));
}

async function deleteHandler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const user = await getAuthenticatedUser(req);
  const blogId = await getPathParamAsNumber(params, "id");
  await unlikeBlog(user.id, blogId);
  return { message: "Unliked" };
}

export const GET = createGetHandler(getHandler);
export const POST = createPostHandler(postHandler);
export const DELETE = createDeleteHandler(deleteHandler);
