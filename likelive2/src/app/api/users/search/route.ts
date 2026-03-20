import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { searchUsers } from "@/lib/services/user-service";
import { getQueryParam, getQueryParamAsNumber } from "@/lib/utils/request";

async function handler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const keyword = getQueryParam(req, "keyword") || "";
  return await searchUsers(keyword, user.id);
}

export const GET = createGetHandler(handler);
