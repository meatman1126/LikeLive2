/**
 * コメントサービスクラス
 */

import type { Comment } from "@/generated/prisma/client";
import { prisma } from "../prisma/client";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { createNotification } from "./notification-service";

/**
 * 指定されたブログのコメント一覧を取得します。
 *
 * @param blogId ブログID
 * @returns コメント一覧
 */
export async function findCommentsByBlogId(blogId: number): Promise<Comment[]> {
  return prisma.comment.findMany({
    where: {
      blogId,
      isDeleted: false,
    },
    include: {
      author: true,
    },
    orderBy: {
      commentCreatedTime: "asc",
    },
  });
}

/**
 * 指定されたブログの親コメント一覧を取得します。
 * （返信コメントではない、直接ブログに紐づくコメント）
 *
 * @param blogId ブログID
 * @returns 親コメント一覧
 */
export async function findParentCommentsByBlogId(
  blogId: number
): Promise<Comment[]> {
  // 返信コメントとして存在するコメントIDのリストを取得
  const replyCommentIds = await prisma.commentTree.findMany({
    select: {
      replyCommentId: true,
    },
  });

  const replyIds = replyCommentIds.map((ct: { replyCommentId: number }) => ct.replyCommentId);

  // 返信コメントとして存在しないコメント（親コメント）を取得
  const whereClause: any = {
    blogId,
    isDeleted: false,
  };

  // 返信IDが存在する場合のみ、notIn条件を追加
  if (replyIds.length > 0) {
    whereClause.id = {
      notIn: replyIds,
    };
  }

  return prisma.comment.findMany({
    where: whereClause,
    include: {
      author: true,
    },
    orderBy: {
      commentCreatedTime: "asc",
    },
  });
}

/**
 * 指定されたIDのコメントを取得します。
 *
 * @param id コメントID
 * @param includeDeleted 削除済みも含めるかどうか
 * @returns コメント
 * @throws NotFoundError コメントが見つからない場合
 */
export async function getCommentById(
  id: number,
  includeDeleted: boolean = false
): Promise<Comment> {
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      author: true,
    },
  });

  if (!comment) {
    throw new NotFoundError(`Comment not found with id: ${id}`);
  }

  if (!includeDeleted && comment.isDeleted) {
    throw new NotFoundError(`Comment not found with id: ${id}`);
  }

  return comment;
}

/**
 * コメントを作成します。
 *
 * @param authorId 作成者ID
 * @param blogId ブログID
 * @param content コメント内容
 * @param parentCommentId 親コメントID（返信の場合）
 * @param createdBy 作成者
 * @returns 作成されたコメント
 */
export async function createComment(
  authorId: number,
  blogId: number,
  content: string,
  parentCommentId: number | null,
  createdBy: string
): Promise<Comment> {
  // ブログの存在確認
  await prisma.blog.findUniqueOrThrow({
    where: { id: blogId },
  });

  // 親コメントの存在確認（指定された場合）
  if (parentCommentId !== null) {
    await getCommentById(parentCommentId);
  }

  // コメントを作成
  const comment = await prisma.comment.create({
    data: {
      content,
      authorId,
      blogId,
      createdBy,
      updatedBy: createdBy,
    },
    include: {
      author: true,
    },
  });

  // 返信の場合、コメントツリーに追加
  if (parentCommentId !== null) {
    // 既存の返信数を取得
    const replyCount = await prisma.commentTree.count({
      where: {
        parentCommentId,
      },
    });

    await prisma.commentTree.create({
      data: {
        parentCommentId,
        replyCommentId: comment.id,
        replyNumber: replyCount + 1,
        createdBy,
        updatedBy: createdBy,
      },
    });
  }

  // ブログのコメント数を増やす
  const blog = await prisma.blog.update({
    where: { id: blogId },
    data: {
      commentCount: {
        increment: 1,
      },
    },
  });

  // コメント通知を作成（ブログの作者に通知、ただし自分自身のブログへのコメントは除く）
  if (blog.authorId !== authorId) {
    await createNotification(
      blog.authorId, // 通知対象: ブログの作者
      "COMMENT",
      authorId, // 通知を発生させたユーザー（コメント作成者）
      blogId,
      comment.id,
      createdBy
    );
  }

  return comment;
}

/**
 * コメントを更新します。
 *
 * @param id コメントID
 * @param authorId 作成者ID（権限チェック用）
 * @param content コメント内容
 * @param updatedBy 更新者
 * @returns 更新されたコメント
 * @throws NotFoundError コメントが見つからない場合
 * @throws ForbiddenError 権限がない場合
 */
export async function updateComment(
  id: number,
  authorId: number,
  content: string,
  updatedBy: string
): Promise<Comment> {
  // コメントの存在確認と権限チェック
  const existingComment = await getCommentById(id, true);

  if (existingComment.authorId !== authorId) {
    throw new ForbiddenError(
      "You do not have permission to update this comment"
    );
  }

  // コメントを更新
  return prisma.comment.update({
    where: { id },
    data: {
      content,
      updatedBy,
    },
    include: {
      author: true,
    },
  });
}

/**
 * コメントを論理削除します。
 *
 * @param id コメントID
 * @param authorId 作成者ID（権限チェック用）
 * @param updatedBy 更新者
 * @throws NotFoundError コメントが見つからない場合
 * @throws ForbiddenError 権限がない場合
 */
export async function deleteComment(
  id: number,
  authorId: number,
  updatedBy: string
): Promise<void> {
  // コメントの存在確認と権限チェック
  const existingComment = await getCommentById(id, true);

  if (existingComment.authorId !== authorId) {
    throw new ForbiddenError(
      "You do not have permission to delete this comment"
    );
  }

  // コメントを論理削除
  await prisma.comment.update({
    where: { id },
    data: {
      isDeleted: true,
      updatedBy,
    },
  });

  // ブログのコメント数を減らす
  await prisma.blog.update({
    where: { id: existingComment.blogId },
    data: {
      commentCount: {
        decrement: 1,
      },
    },
  });
}

/**
 * 指定されたコメントへの返信一覧を取得します。
 *
 * @param parentCommentId 親コメントID
 * @returns 返信コメント一覧
 */
export async function findRepliesByParentCommentId(
  parentCommentId: number
): Promise<Comment[]> {
  const commentTree = await prisma.commentTree.findMany({
    where: {
      parentCommentId,
    },
    include: {
      replyComment: {
        include: {
          author: true,
        },
      },
    },
    orderBy: {
      replyNumber: "asc",
    },
  });

  return commentTree
    .map((ct: { replyComment: any }) => ct.replyComment)
    .filter((comment: { isDeleted: boolean }) => !comment.isDeleted);
}
