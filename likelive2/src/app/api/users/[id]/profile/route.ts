import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getUserProfile } from "@/lib/services/user-service";
import { getPathParamAsNumber } from "@/lib/utils/request";

async function handler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const user = await getAuthenticatedUser(req);
  const targetId = await getPathParamAsNumber(params, "id");
  return await getUserProfile(targetId, true, user.id);
}

export const GET = createGetHandler(handler);
