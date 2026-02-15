"use server";

/**
 * Notification関連のServer Actions
 */

import { getCurrentUserIdFromHeaders } from "@/lib/auth/server-actions-auth";
import { prisma } from "@/lib/prisma/client";
import {
  deleteNotification,
  getNotificationById,
  getNotificationsByUserId,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from "@/lib/services/notification-service";
import { ValidationError } from "@/lib/utils/errors";
import { z } from "zod";

const markReadSchema = z.object({
  notificationIds: z.array(z.number().int().positive()),
});

/**
 * ログインユーザの通知一覧を取得します。
 *
 * @param page ページ番号（1から始まる）
 * @param limit 1ページあたりの件数
 * @param includeRead 既読通知も含めるかどうか
 */
export async function getNotificationsAction(
  page: number = 1,
  limit: number = 10,
  includeRead: boolean = false
) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return getNotificationsByUserId(currentUserId, page, limit, includeRead);
}

/**
 * 通知の詳細を取得します。
 *
 * @param id 通知ID
 */
export async function getNotificationByIdAction(id: number) {
  return getNotificationById(id);
}

/**
 * 通知を既読にします。
 *
 * @param id 通知ID
 */
export async function markNotificationAsReadAction(id: number) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  await markNotificationAsRead(id, currentUserId);
  return { message: "Notification marked as read" };
}

/**
 * 複数の通知を既読にします。
 *
 * @param notificationIds 通知IDリスト
 */
export async function markNotificationsAsReadAction(notificationIds: number[]) {
  // バリデーション
  const validationResult = markReadSchema.safeParse({ notificationIds });
  if (!validationResult.success) {
    throw new ValidationError("Invalid request data", validationResult.error);
  }

  const currentUserId = await getCurrentUserIdFromHeaders();

  // 通知を既読にする
  await prisma.notification.updateMany({
    where: {
      id: { in: validationResult.data.notificationIds },
      targetUserId: currentUserId,
      isDeleted: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { message: "Notifications marked as read" };
}

/**
 * すべての通知を既読にします。
 */
export async function markAllNotificationsAsReadAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();

  await prisma.notification.updateMany({
    where: {
      targetUserId: currentUserId,
      isRead: false,
      isDeleted: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { message: "All notifications marked as read" };
}

/**
 * 通知を削除します。
 *
 * @param id 通知ID
 */
export async function deleteNotificationAction(id: number) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  await deleteNotification(id, currentUserId);
  return { message: "Notification deleted successfully" };
}

/**
 * 未読通知数を取得します。
 */
export async function getUnreadNotificationCountAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return getUnreadNotificationCount(currentUserId);
}

/**
 * 未読通知一覧を取得します。
 */
export async function getUnreadNotificationsAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();

  return prisma.notification.findMany({
    where: {
      targetUserId: currentUserId,
      isRead: false,
      isDeleted: false,
    },
    include: {
      triggerUser: true,
      relatedBlog: true,
      relatedComment: true,
    },
    orderBy: {
      notificationCreatedAt: "desc",
    },
  });
}
