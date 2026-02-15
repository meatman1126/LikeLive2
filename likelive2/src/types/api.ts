/**
 * API関連の型定義
 */

import type { User, Blog, Comment, Artist, Notification, Follow } from '@/generated/prisma/client';

// 認証関連
export interface AuthenticatedUser {
  id: number;
  displayName: string | null;
  subject: string | null;
  profileImageUrl: string | null;
}

// ページネーション
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 検索結果
export interface SearchResponse<T> {
  resultCount: number;
  data: T[];
  hasMore: boolean;
}

// ユーザー関連
export type UserResponse = User;
export type UserProfileResponse = User & {
  followerCount: number;
  followingCount: number;
  blogCount: number;
};

// ブログ関連
export type BlogResponse = Blog;
export type BlogListResponse = Blog[];

// コメント関連
export type CommentResponse = Comment;
export type CommentTreeResponse = Comment & {
  replies?: Comment[];
};

// アーティスト関連
export type ArtistResponse = Artist;

// 通知関連
export type NotificationResponse = Notification;

// フォロー関連
export type FollowResponse = Follow;

