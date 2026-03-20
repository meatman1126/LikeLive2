import { NextRequest } from "next/server";
import { createGetHandler, createPutHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getUserProfile, updateUserProfile } from "@/lib/services/user-service";
import { getRequestBody } from "@/lib/utils/request";

async function getHandler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  return user;
}

async function putHandler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const body = await getRequestBody<{ displayName?: string; selfIntroduction?: string; profileImageUrl?: string }>(req);
  const updated = await updateUserProfile(user.id, body, String(user.id));
  return updated;
}

export const GET = createGetHandler(getHandler);
export const PUT = createPutHandler(putHandler);
