import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getFollowers } from "@/lib/services/follow-service";

async function handler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  return await getFollowers(user.id);
}

export const GET = createGetHandler(handler);
