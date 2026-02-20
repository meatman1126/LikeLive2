/**
 * プロフィール関連の型定義
 */

import type { User, Artist, Blog } from "@prisma/client";

export interface ProfileViewDto {
  userId: number;
  displayName: string | null;
  profileImageUrl: string | null;
  selfIntroduction: string | null;
  favoriteArtistList: Artist[];
  createdBlogList: Blog[];
  followedCount: number;
  followerCount: number;
  isFollow: boolean | null; // ログインユーザ自身の情報を取得する場合はnull
}

