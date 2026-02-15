/**
 * コメント関連のバリデーションスキーマ
 */

import { z } from "zod";

/**
 * コメント作成フォームのバリデーションスキーマ
 */
export const commentCreateSchema = z.object({
  blogId: z.number().int().positive(),
  content: z.string().min(1).max(5000),
  parentCommentId: z.number().int().positive().nullable().optional(),
});

/**
 * コメント更新フォームのバリデーションスキーマ
 */
export const commentUpdateSchema = z.object({
  content: z.string().min(1).max(5000),
});

export type CommentCreateForm = z.infer<typeof commentCreateSchema>;
export type CommentUpdateForm = z.infer<typeof commentUpdateSchema>;
