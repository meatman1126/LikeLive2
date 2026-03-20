import { NextRequest } from "next/server";
import { createPostHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { prisma } from "@/lib/prisma/client";

async function handler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  await prisma.notification.updateMany({
    where: { targetUserId: user.id, isRead: false },
    data: { isRead: true },
  });
  return { message: "All notifications marked as read" };
}

export const POST = createPostHandler(handler);
