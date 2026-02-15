"use server";

/**
 * Public API関連のServer Actions（認証不要）
 */

import {
  findArtistsByBlogId,
  getBlogById,
  incrementViewCount,
} from "@/lib/services/blog-service";
import {
  findParentCommentsByBlogId,
  findRepliesByParentCommentId,
} from "@/lib/services/comment-service";
import { NotFoundError } from "@/lib/utils/errors";
import type { Comment } from "@/generated/prisma/client";

/**
 * 未認証ユーザ向けにブログ記事を取得します（公開中のブログのみ）。
 *
 * @param id ブログID
 */
export async function getPublicBlogAction(id: number) {
  const blog = await getBlogById(id);

  // 公開中のブログのみ取得可能
  if (blog.status !== "PUBLISHED" || blog.isDeleted) {
    throw new NotFoundError("Blog not found or not published");
  }

  // 閲覧数を増やす
  await incrementViewCount(id);

  // 閲覧数を反映するため、再度取得
  return getBlogById(id);
}

/**
 * 未認証ユーザ向けにブログに関連するアーティスト一覧を取得します。
 *
 * @param blogId ブログID
 */
export async function getPublicBlogArtistsAction(blogId: number) {
  return findArtistsByBlogId(blogId);
}

/**
 * 親コメントと返信を含む階層構造の型
 */
export type CommentWithReplies = Comment & {
  author: Comment["author"];
  replies: CommentWithReplies[];
};

/**
 * 未認証ユーザ向けにブログのコメント一覧を取得します。
 * 親コメントとその返信を階層構造で返します。
 *
 * @param blogId ブログID
 */
export async function getPublicBlogCommentsAction(
  blogId: number
): Promise<CommentWithReplies[]> {
  // 親コメントを取得
  const parentComments = await findParentCommentsByBlogId(blogId);

  // 各親コメントの返信を取得
  const commentsWithReplies: CommentWithReplies[] = await Promise.all(
    parentComments.map(async (parentComment) => {
      const replies = await findRepliesByParentCommentId(parentComment.id);
      return {
        ...parentComment,
        replies: replies.map((reply) => ({
          ...reply,
          replies: [], // 返信の返信は現在サポートしていない
        })),
      };
    })
  );

  return commentsWithReplies;
}

/**
 * 未認証ユーザ向けにコメントの返信一覧を取得します。
 *
 * @param parentId 親コメントID
 */
export async function getPublicCommentRepliesAction(parentId: number) {
  return findRepliesByParentCommentId(parentId);
}
