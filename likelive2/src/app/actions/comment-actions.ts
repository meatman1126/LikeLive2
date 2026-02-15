"use server";

/**
 * Comment関連のServer Actions
 */

import { getCurrentUserIdFromHeaders } from "@/lib/auth/server-actions-auth";
import {
  createComment,
  deleteComment,
  findCommentsByBlogId,
  findRepliesByParentCommentId,
  getCommentById,
  updateComment,
} from "@/lib/services/comment-service";
import { ValidationError } from "@/lib/utils/errors";
import {
  commentCreateSchema,
  commentUpdateSchema,
} from "@/lib/validations/comment-validation";

/**
 * コメントを作成します。
 *
 * @param blogId ブログID
 * @param content コメント内容
 * @param parentCommentId 親コメントID（返信の場合）
 */
export async function createCommentAction(
  blogId: number,
  content: string,
  parentCommentId?: number | null
) {
  // バリデーション
  const validationResult = commentCreateSchema.safeParse({
    blogId,
    content,
    parentCommentId: parentCommentId || undefined,
  });

  if (!validationResult.success) {
    throw new ValidationError("Invalid request data", validationResult.error);
  }

  const currentUserId = await getCurrentUserIdFromHeaders();

  return createComment(
    currentUserId,
    validationResult.data.blogId,
    validationResult.data.content,
    validationResult.data.parentCommentId || null,
    currentUserId.toString()
  );
}

/**
 * コメントの詳細を取得します。
 *
 * @param id コメントID
 */
export async function getCommentByIdAction(id: number) {
  return getCommentById(id);
}

/**
 * コメントを更新します。
 *
 * @param id コメントID
 * @param content コメント内容
 */
export async function updateCommentAction(id: number, content: string) {
  // バリデーション
  const validationResult = commentUpdateSchema.safeParse({ content });

  if (!validationResult.success) {
    throw new ValidationError("Invalid request data", validationResult.error);
  }

  const currentUserId = await getCurrentUserIdFromHeaders();

  return updateComment(
    id,
    currentUserId,
    validationResult.data.content,
    currentUserId.toString()
  );
}

/**
 * コメントを削除します。
 *
 * @param id コメントID
 */
export async function deleteCommentAction(id: number) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  await deleteComment(id, currentUserId, currentUserId.toString());
  return { message: "Comment deleted successfully" };
}

/**
 * ブログのコメント一覧を取得します。
 *
 * @param blogId ブログID
 */
export async function getCommentsByBlogIdAction(blogId: number) {
  return findCommentsByBlogId(blogId);
}

/**
 * コメントの返信一覧を取得します。
 *
 * @param parentId 親コメントID
 */
export async function getCommentRepliesAction(parentId: number) {
  return findRepliesByParentCommentId(parentId);
}
