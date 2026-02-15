/**
 * ユーザー関連のバリデーションスキーマ
 */

import { z } from 'zod';

/**
 * ユーザー更新フォームのバリデーションスキーマ
 */
export const userUpdateSchema = z.object({
  displayName: z.string().max(255).optional(),
  selfIntroduction: z.string().max(1000).optional().nullable(),
  profileImageUrl: z.string().optional().nullable(),
  favoriteArtistList: z.array(z.object({
    id: z.string(),
    name: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
  })).optional(),
});

/**
 * ユーザー初回登録フォームのバリデーションスキーマ
 */
export const userRegistrationSchema = z.object({
  userName: z.string().max(255),
  artistList: z.array(z.object({
    id: z.string(),
    name: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
  })).optional(),
});

export type UserUpdateForm = z.infer<typeof userUpdateSchema>;
export type UserRegistrationForm = z.infer<typeof userRegistrationSchema>;

