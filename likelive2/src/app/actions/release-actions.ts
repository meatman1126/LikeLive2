"use server";

/**
 * Release（新譜）関連の Server Actions
 */

import { getCurrentUserIdFromHeaders } from "@/lib/auth/server-actions-auth";
import { findReleasesForUser } from "@/lib/services/release-service";

/**
 * ログインユーザーのお気に入りアーティストの新譜一覧を取得します。
 *
 * @param limit 取得件数（デフォルト30）
 * @param offset オフセット（デフォルト0）
 */
export async function getMyReleasesAction(
  limit: number = 30,
  offset: number = 0
) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return findReleasesForUser(currentUserId, limit, offset);
}
