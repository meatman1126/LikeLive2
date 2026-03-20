import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getUnreadNotificationCount } from "@/lib/services/notification-service";

async function handler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const count = await getUnreadNotificationCount(user.id);
  return { count };
}

export const GET = createGetHandler(handler);
