import { NextRequest } from "next/server";
import { createPostHandler, createDeleteHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { followUser, unfollowUser } from "@/lib/services/follow-service";
import { getRequestBody } from "@/lib/utils/request";

async function postHandler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const body = await getRequestBody<{ followedId: number }>(req);
  return await followUser(user.id, body.followedId, String(user.id));
}

async function deleteHandler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const body = await getRequestBody<{ followedId: number }>(req);
  await unfollowUser(user.id, body.followedId);
  return { message: "Unfollowed" };
}

export const POST = createPostHandler(postHandler);
export const DELETE = createDeleteHandler(deleteHandler);
