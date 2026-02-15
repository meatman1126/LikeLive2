"use server";

/**
 * User関連のServer Actions
 */

import {
  getCurrentUserFromHeaders,
  getCurrentUserIdFromHeaders,
} from "@/lib/auth/server-actions-auth";
import { prisma } from "@/lib/prisma/client";
import { isFollowing } from "@/lib/services/follow-service";
import { getLikedBlogsByUserId } from "@/lib/services/like-service";
import { findFavoriteArtistsByUserId } from "@/lib/services/user-artist-service";
import {
  deleteUser,
  getUserById,
  getUserProfile,
  initialUpdateUser,
  registerUser,
  searchUsers,
  updateUserProfile,
} from "@/lib/services/user-service";
import type {
  UserRegistrationForm,
  UserUpdateForm,
} from "@/lib/validations/user-validation";

/**
 * 現在ログインしているユーザー情報を取得します。
 */
export async function getCurrentUserAction() {
  return getCurrentUserFromHeaders();
}

/**
 * 指定されたユーザー情報を取得します。
 *
 * @param id ユーザーID
 */
export async function getUserByIdAction(id: number) {
  return getUserById(id);
}

/**
 * ログインユーザのプロフィール情報を取得します。
 */
export async function getMyProfileAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return getUserProfile(currentUserId, false, currentUserId);
}

/**
 * 指定されたユーザーのプロフィール情報を取得します。
 *
 * @param targetUserId 対象ユーザーID
 */
export async function getUserProfileAction(targetUserId: number) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return getUserProfile(targetUserId, true, currentUserId);
}

/**
 * ユーザーを検索します。
 *
 * @param keyword 検索キーワード
 * @param page ページ番号（1から始まる）
 * @param limit 1ページあたりの件数
 */
export async function searchUsersAction(
  keyword: string,
  page: number = 1,
  limit: number = 10
) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  const users = await searchUsers(keyword, currentUserId);

  // ページネーション処理
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = users.slice(startIndex, endIndex);

  return {
    data: paginatedUsers,
    total: users.length,
    page,
    limit,
  };
}

/**
 * ユーザー情報を更新します。
 *
 * @param data 更新データ
 */
export async function updateUserAction(data: UserUpdateForm) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return updateUserProfile(currentUserId, data, currentUserId.toString());
}

/**
 * ユーザーの初回登録情報を更新します。
 *
 * @param data 登録データ
 */
export async function initialUpdateUserAction(data: UserRegistrationForm) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return initialUpdateUser(currentUserId, data, currentUserId.toString());
}

/**
 * ユーザーを新規登録します。
 *
 * @param data 登録データ
 */
export async function registerUserAction(data: UserRegistrationForm) {
  const currentUser = await getCurrentUserFromHeaders();
  return registerUser(currentUser.subject, data.userName);
}

/**
 * ユーザーを削除します。
 */
export async function deleteUserAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();
  const currentUser = await getCurrentUserFromHeaders();
  await deleteUser(currentUserId, currentUser.subject);
  return { message: "User deleted successfully" };
}

/**
 * ログインユーザがいいねしたブログ一覧を取得します。
 */
export async function getLikedBlogsAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return getLikedBlogsByUserId(currentUserId);
}

/**
 * ログインユーザの好きなアーティスト一覧を取得します。
 */
export async function getMyArtistsAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return findFavoriteArtistsByUserId(currentUserId);
}

// これらの関数は follow-actions.ts に移動しました
// getMyFollowedUsersAction と getMyFollowersAction を使用してください

/**
 * 同じアーティストが好きなユーザ一覧を取得します。
 */
export async function getSimilarUsersAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();

  // ログインユーザの好きなアーティストを取得
  const userArtists = await prisma.userArtist.findMany({
    where: {
      userId: currentUserId,
    },
    select: {
      artistId: true,
    },
  });

  const artistIds = userArtists.map((ua: { artistId: string }) => ua.artistId);

  if (artistIds.length === 0) {
    return [];
  }

  // 同じアーティストが好きな他のユーザを取得
  const similarUserArtists = await prisma.userArtist.findMany({
    where: {
      artistId: {
        in: artistIds,
      },
      userId: {
        not: currentUserId,
      },
    },
    include: {
      user: true,
      artist: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return similarUserArtists;
}

/**
 * おすすめユーザリストを取得します。
 */
export async function getRecommendedUsersAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();

  // ログインユーザの好きなアーティストIDリストを取得
  const userArtists = await prisma.userArtist.findMany({
    where: {
      userId: currentUserId,
    },
    select: {
      artistId: true,
    },
  });

  const artistIds = userArtists.map((ua: { artistId: string }) => ua.artistId);

  if (artistIds.length === 0) {
    return [];
  }

  // 共通アーティストを持つ他のユーザIDを取得（重複を除外）
  const recommendedUserArtists = await prisma.userArtist.findMany({
    where: {
      artistId: {
        in: artistIds,
      },
      userId: {
        not: currentUserId,
      },
    },
    select: {
      userId: true,
    },
    distinct: ["userId"],
  });

  const recommendedUserIds = recommendedUserArtists.map(
    (ua: { userId: number }) => ua.userId
  );

  if (recommendedUserIds.length === 0) {
    return [];
  }

  // ユーザ情報を取得
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: recommendedUserIds,
      },
      enabled: true,
    },
    include: {
      userArtists: {
        include: {
          artist: true,
        },
      },
    },
    take: 20, // 最大20件
  });

  // フォロー状況を追加
  const recommendedUsers = await Promise.all(
    users.map(
      async (user: {
        id: number;
        displayName: string | null;
        profileImageUrl: string | null;
        selfIntroduction: string | null;
        userArtists: Array<{ artist: any }>;
      }) => {
        const isFollow = await isFollowing(currentUserId, user.id);
        return {
          userId: user.id,
          displayName: user.displayName,
          profileImageUrl: user.profileImageUrl,
          selfIntroduction: user.selfIntroduction,
          favoriteArtistList: user.userArtists.map((ua) => ua.artist),
          isFollow,
        };
      }
    )
  );

  return recommendedUsers;
}
