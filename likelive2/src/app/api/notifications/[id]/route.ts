import { NextRequest } from "next/server";
import { createDeleteHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { deleteNotification } from "@/lib/services/notification-service";
import { getPathParamAsNumber } from "@/lib/utils/request";

async function handler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const user = await getAuthenticatedUser(req);
  const id = await getPathParamAsNumber(params, "id");
  await deleteNotification(id, user.id);
  return { message: "Notification deleted" };
}

export const DELETE = createDeleteHandler(handler);
