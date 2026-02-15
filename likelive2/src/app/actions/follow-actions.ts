"use server";

/**
 * Follow関連のServer Actions
 */

import { getCurrentUserIdFromHeaders } from "@/lib/auth/server-actions-auth";
import {
  followUser,
  getFollowedUsers,
  getFollowers,
  isFollowing,
  unfollowUser,
} from "@/lib/services/follow-service";
import { ValidationError } from "@/lib/utils/errors";
import { z } from "zod";

const followSchema = z.object({
  followedId: z.number().int().positive(),
});

/**
 * ユーザーをフォローします。
 *
 * @param followedId フォローするユーザーID
 */
export async function followUserAction(followedId: number) {
  // バリデーション
  const validationResult = followSchema.safeParse({ followedId });
  if (!validationResult.success) {
    throw new ValidationError("Invalid request data", validationResult.error);
  }

  const currentUserId = await getCurrentUserIdFromHeaders();

  return followUser(
    currentUserId,
    validationResult.data.followedId,
    currentUserId.toString()
  );
}

/**
 * ユーザーのフォローを解除します。
 *
 * @param followedId フォロー解除するユーザーID
 */
export async function unfollowUserAction(followedId: number) {
  // バリデーション
  const validationResult = followSchema.safeParse({ followedId });
  if (!validationResult.success) {
    throw new ValidationError("Invalid request data", validationResult.error);
  }

  const currentUserId = await getCurrentUserIdFromHeaders();

  await unfollowUser(currentUserId, validationResult.data.followedId);

  return { message: "Unfollowed successfully" };
}

/**
 * 指定したユーザのフォロワー一覧を取得します。
 *
 * @param userId ユーザーID
 */
export async function getFollowersAction(userId: number) {
  return getFollowers(userId);
}

/**
 * 指定したユーザがフォローしているユーザー一覧を取得します。
 *
 * @param userId ユーザーID
 */
export async function getFollowedUsersAction(userId: number) {
  return getFollowedUsers(userId);
}

/**
 * ログインユーザがフォローしているユーザー一覧を取得します。
 */
export async function getMyFollowedUsersAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return getFollowedUsers(currentUserId);
}

/**
 * ログインユーザをフォローしているユーザー一覧を取得します。
 */
export async function getMyFollowersAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return getFollowers(currentUserId);
}

/**
 * ログインユーザが指定したユーザーをフォローしているか確認します。
 *
 * @param followedId フォローされているユーザーID
 */
export async function isFollowingAction(followedId: number) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return isFollowing(currentUserId, followedId);
}
