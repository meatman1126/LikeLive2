import { NextRequest } from "next/server";
import { createPostHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { markNotificationAsRead } from "@/lib/services/notification-service";
import { getPathParamAsNumber } from "@/lib/utils/request";

async function handler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const user = await getAuthenticatedUser(req);
  const id = await getPathParamAsNumber(params, "id");
  await markNotificationAsRead(id, user.id);
  return { message: "Marked as read" };
}

export const POST = createPostHandler(handler);
