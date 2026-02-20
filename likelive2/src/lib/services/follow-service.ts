/**
 * フォローサービスクラス
 */

import type { Follow } from "@prisma/client";
import { prisma } from "../prisma/client";
import { ConflictError, ForbiddenError, NotFoundError } from "../utils/errors";
import { createNotification } from "./notification-service";

/**
 * 指定したユーザがフォローしているユーザ数をカウントします。
 *
 * @param userId ユーザーID
 * @returns フォロー中のユーザ数
 */
export async function countFollowedUsers(userId: number): Promise<number> {
  return prisma.follow.count({
    where: {
      followerId: userId,
    },
  });
}

/**
 * 指定したユーザをフォローしているユーザ数をカウントします。
 *
 * @param userId ユーザーID
 * @returns フォロワー数
 */
export async function countFollowers(userId: number): Promise<number> {
  return prisma.follow.count({
    where: {
      followedId: userId,
    },
  });
}

/**
 * 指定した2ユーザのフォロー有無を確認します。
 *
 * @param followerId フォローしているユーザーID
 * @param followedId フォローされているユーザーID
 * @returns フォローしている場合はtrue、フォローしていない場合はfalse
 */
export async function isFollowing(
  followerId: number,
  followedId: number
): Promise<boolean> {
  const follow = await prisma.follow.findFirst({
    where: {
      followerId,
      followedId,
    },
  });

  return follow !== null;
}

/**
 * ユーザーをフォローします。
 *
 * @param followerId フォローするユーザーID
 * @param followedId フォローされるユーザーID
 * @param createdBy 作成者
 * @returns 作成されたフォロー関係
 * @throws ConflictError 既にフォローしている場合
 * @throws ForbiddenError 自分自身をフォローしようとした場合
 */
export async function followUser(
  followerId: number,
  followedId: number,
  createdBy: string
): Promise<Follow> {
  // 自分自身をフォローできないようにする
  if (followerId === followedId) {
    throw new ForbiddenError("You cannot follow yourself");
  }

  // 既にフォローしているか確認
  const existingFollow = await prisma.follow.findFirst({
    where: {
      followerId,
      followedId,
    },
  });

  if (existingFollow) {
    throw new ConflictError("You are already following this user");
  }

  // フォロー関係を作成
  const follow = await prisma.follow.create({
    data: {
      followerId,
      followedId,
      createdBy,
      updatedBy: createdBy,
    },
  });

  // フォロー通知を作成
  await createNotification(
    followedId, // 通知対象: フォローされたユーザー
    "FOLLOW",
    followerId, // 通知を発生させたユーザー
    null,
    null,
    createdBy
  );

  return follow;
}

/**
 * ユーザーのフォローを解除します。
 *
 * @param followerId フォロー解除するユーザーID
 * @param followedId フォロー解除されるユーザーID
 * @throws NotFoundError フォロー関係が見つからない場合
 */
export async function unfollowUser(
  followerId: number,
  followedId: number
): Promise<void> {
  const follow = await prisma.follow.findFirst({
    where: {
      followerId,
      followedId,
    },
  });

  if (!follow) {
    throw new NotFoundError("Follow relationship not found");
  }

  await prisma.follow.delete({
    where: {
      id: follow.id,
    },
  });
}

/**
 * 指定したユーザがフォローしているユーザー一覧を取得します。
 *
 * @param userId ユーザーID
 * @returns フォロー中のユーザー一覧
 */
export async function getFollowedUsers(userId: number): Promise<Follow[]> {
  return prisma.follow.findMany({
    where: {
      followerId: userId,
    },
    include: {
      followed: true,
    },
    orderBy: {
      followAt: "desc",
    },
  });
}

/**
 * 指定したユーザをフォローしているユーザー一覧を取得します。
 *
 * @param userId ユーザーID
 * @returns フォロワー一覧
 */
export async function getFollowers(userId: number): Promise<Follow[]> {
  return prisma.follow.findMany({
    where: {
      followedId: userId,
    },
    include: {
      follower: true,
    },
    orderBy: {
      followAt: "desc",
    },
  });
}
