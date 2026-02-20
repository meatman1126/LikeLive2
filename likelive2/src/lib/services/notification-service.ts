/**
 * 通知サービスクラス
 */

import type { Notification, NotificationType } from "@prisma/client";
import { prisma } from "../prisma/client";
import { NotFoundError } from "../utils/errors";
import { type PaginationResult } from "../utils/pagination";

/**
 * 指定されたユーザーの通知一覧を取得します（ページネーション対応）。
 *
 * @param userId ユーザーID
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 * @param includeRead 既読通知も含めるかどうか
 * @returns 通知一覧とページネーション情報
 */
export async function getNotificationsByUserId(
  userId: number,
  page: number = 1,
  limit: number = 10,
  includeRead: boolean = false
): Promise<PaginationResult<Notification>> {
  const skip = (page - 1) * limit;

  const where: {
    targetUserId: number;
    isDeleted: boolean;
    isRead?: boolean;
  } = {
    targetUserId: userId,
    isDeleted: false,
  };

  if (!includeRead) {
    where.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        triggerUser: true,
        relatedBlog: true,
        relatedComment: true,
      },
      orderBy: {
        notificationCreatedAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    data: notifications,
    total,
    page,
    limit,
    hasMore: skip + notifications.length < total,
  };
}

/**
 * 指定されたIDの通知を取得します。
 *
 * @param id 通知ID
 * @returns 通知
 * @throws NotFoundError 通知が見つからない場合
 */
export async function getNotificationById(id: number): Promise<Notification> {
  const notification = await prisma.notification.findUnique({
    where: { id },
    include: {
      triggerUser: true,
      relatedBlog: true,
      relatedComment: true,
    },
  });

  if (!notification || notification.isDeleted) {
    throw new NotFoundError(`Notification not found with id: ${id}`);
  }

  return notification;
}

/**
 * 通知を既読にします。
 *
 * @param id 通知ID
 * @param userId ユーザーID（権限チェック用）
 * @throws NotFoundError 通知が見つからない場合
 */
export async function markNotificationAsRead(
  id: number,
  userId: number
): Promise<void> {
  const notification = await getNotificationById(id);

  if (notification.targetUserId !== userId) {
    throw new NotFoundError(`Notification not found with id: ${id}`);
  }

  await prisma.notification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * 指定されたユーザーのすべての通知を既読にします。
 *
 * @param userId ユーザーID
 */
export async function markAllNotificationsAsRead(
  userId: number
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      targetUserId: userId,
      isRead: false,
      isDeleted: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * 通知を削除します（論理削除）。
 *
 * @param id 通知ID
 * @param userId ユーザーID（権限チェック用）
 * @throws NotFoundError 通知が見つからない場合
 */
export async function deleteNotification(
  id: number,
  userId: number
): Promise<void> {
  const notification = await getNotificationById(id);

  if (notification.targetUserId !== userId) {
    throw new NotFoundError(`Notification not found with id: ${id}`);
  }

  await prisma.notification.update({
    where: { id },
    data: {
      isDeleted: true,
    },
  });
}

/**
 * 指定されたユーザーの未読通知数を取得します。
 *
 * @param userId ユーザーID
 * @returns 未読通知数
 */
export async function getUnreadNotificationCount(
  userId: number
): Promise<number> {
  return prisma.notification.count({
    where: {
      targetUserId: userId,
      isRead: false,
      isDeleted: false,
    },
  });
}

/**
 * 通知を作成します（内部使用）。
 *
 * @param targetUserId 通知対象ユーザーID
 * @param notificationType 通知タイプ
 * @param triggerUserId 通知を発生させたユーザーID（オプション）
 * @param blogId 関連ブログID（オプション）
 * @param commentId 関連コメントID（オプション）
 * @param createdBy 作成者
 * @returns 作成された通知
 */
export async function createNotification(
  targetUserId: number,
  notificationType: NotificationType,
  triggerUserId: number | null,
  blogId: number | null,
  commentId: number | null,
  createdBy: string
): Promise<Notification> {
  return prisma.notification.create({
    data: {
      targetUserId,
      triggerUserId,
      notificationType,
      blogId,
      commentId,
      createdBy,
      updatedBy: createdBy,
    },
  });
}
