import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getUserProfile } from "@/lib/services/user-service";

async function handler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  return await getUserProfile(user.id, false);
}

export const GET = createGetHandler(handler);
