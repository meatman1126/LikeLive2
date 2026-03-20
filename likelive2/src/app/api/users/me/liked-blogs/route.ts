import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getLikedBlogsByUserId } from "@/lib/services/like-service";

async function handler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  return await getLikedBlogsByUserId(user.id);
}

export const GET = createGetHandler(handler);
