import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { isFollowing } from "@/lib/services/follow-service";
import { getPathParamAsNumber } from "@/lib/utils/request";

async function handler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const user = await getAuthenticatedUser(req);
  const targetId = await getPathParamAsNumber(params, "userId");
  const following = await isFollowing(user.id, targetId);
  return { following };
}

export const GET = createGetHandler(handler);
