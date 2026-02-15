/**
 * ブログ関連のバリデーションスキーマ
 */

import { z } from "zod";

/**
 * ブログ作成フォームのバリデーションスキーマ
 */
export const blogCreateSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.unknown(), // JSON形式
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  category: z.enum(["DIARY", "REPORT", "OTHER"]),
  tags: z.string().max(255).optional().nullable(),
  thumbnailUrl: z.string().max(255).url().optional().nullable(),
  slug: z.string().max(255).optional().nullable(),
  setlist: z.unknown().optional().nullable(), // JSON形式
  artistIds: z.array(z.string()).optional(),
});

/**
 * ブログ更新フォームのバリデーションスキーマ
 */
export const blogUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.unknown().optional(), // JSON形式
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  category: z.enum(["DIARY", "REPORT", "OTHER"]).optional(),
  tags: z.string().max(255).optional().nullable(),
  thumbnailUrl: z.string().max(255).url().optional().nullable(),
  slug: z.string().max(255).optional().nullable(),
  setlist: z.unknown().optional().nullable(), // JSON形式
  artistIds: z.array(z.string()).optional(),
});

export type BlogCreateForm = z.infer<typeof blogCreateSchema>;
export type BlogUpdateForm = z.infer<typeof blogUpdateSchema>;
