import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getNotificationsByUserId } from "@/lib/services/notification-service";
import { getQueryParamAsNumber, getQueryParam } from "@/lib/utils/request";

async function handler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const page = getQueryParamAsNumber(req, "page") ?? 1;
  const limit = getQueryParamAsNumber(req, "limit") ?? 20;
  const includeRead = getQueryParam(req, "includeRead") === "true";
  return await getNotificationsByUserId(user.id, page, limit, includeRead);
}

export const GET = createGetHandler(handler);
