"use server";

/**
 * Blog関連のServer Actions
 */

import type { BlogCategory } from "@/generated/prisma/client";
import { getCurrentUserIdFromHeaders } from "@/lib/auth/server-actions-auth";
import { prisma } from "@/lib/prisma/client";
import {
  createBlog,
  deleteBlog,
  findBlogsByUserId,
  getBlogById,
  getBlogBySlug,
  getPublishedBlogs,
  getPublicRecommendedBlogs,
  incrementViewCount,
  searchBlogs,
  searchBlogsByArtistName,
  updateBlog,
} from "@/lib/services/blog-service";
import { findCommentsByBlogId } from "@/lib/services/comment-service";
import {
  getLikesByBlogId,
  isLiked as isBlogLiked,
  likeBlog,
  unlikeBlog,
} from "@/lib/services/like-service";
import { ForbiddenError, ValidationError } from "@/lib/utils/errors";
import type {
  BlogCreateForm,
  BlogUpdateForm,
} from "@/lib/validations/blog-validation";
import {
  blogCreateSchema,
  blogUpdateSchema,
} from "@/lib/validations/blog-validation";

/**
 * 公開中のブログ一覧を取得します。
 *
 * @param page ページ番号（1から始まる）
 * @param limit 1ページあたりの件数
 * @param category カテゴリでフィルタ（オプション）
 */
export async function getPublishedBlogsAction(
  page: number = 1,
  limit: number = 10,
  category?: BlogCategory,
) {
  return getPublishedBlogs(page, limit, category);
}

/**
 * ブログ記事を作成します。
 *
 * @param data ブログ作成データ
 */
export async function createBlogAction(data: BlogCreateForm) {
  // バリデーション
  const validationResult = blogCreateSchema.safeParse(data);
  if (!validationResult.success) {
    throw new ValidationError("Invalid request data", validationResult.error);
  }

  const currentUserId = await getCurrentUserIdFromHeaders();

  // contentが必須であることを保証
  if (!validationResult.data.content) {
    throw new ValidationError("Content is required");
  }

  return createBlog(
    currentUserId,
    {
      ...validationResult.data,
      content: validationResult.data.content,
    },
    currentUserId.toString(),
  );
}

/**
 * ブログ記事の詳細を取得します。
 *
 * @param id ブログID
 */
export async function getBlogByIdAction(id: number) {
  const blog = await getBlogById(id);

  // 公開中のブログの場合、閲覧数を増やす
  if (blog.status === "PUBLISHED" && !blog.isDeleted) {
    await incrementViewCount(id);
    // 閲覧数を反映するため、再度取得
    return getBlogById(id);
  }

  return blog;
}

/**
 * ブログ記事を更新します。
 *
 * @param id ブログID
 * @param data 更新データ
 */
export async function updateBlogAction(id: number, data: BlogUpdateForm) {
  // バリデーション
  const validationResult = blogUpdateSchema.safeParse(data);
  if (!validationResult.success) {
    throw new ValidationError("Invalid request data", validationResult.error);
  }

  const currentUserId = await getCurrentUserIdFromHeaders();

  return updateBlog(
    id,
    currentUserId,
    validationResult.data,
    currentUserId.toString(),
  );
}

/**
 * ブログ記事を削除します。
 *
 * @param id ブログID
 */
export async function deleteBlogAction(id: number) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  await deleteBlog(id, currentUserId, currentUserId.toString());
  return { message: "Blog deleted successfully" };
}

/**
 * キーワードでブログ記事を検索します。
 *
 * @param keyword 検索キーワード
 * @param page ページ番号（1から始まる）
 * @param limit 1ページあたりの件数
 * @param category カテゴリでフィルタ（オプション）
 */
export async function searchBlogsAction(
  keyword: string,
  page: number = 1,
  limit: number = 10,
  category?: BlogCategory,
) {
  return searchBlogs(keyword, page, limit, category);
}

/**
 * アーティスト名でブログ記事を検索します。
 *
 * @param artistName アーティスト名（部分一致）
 * @param page ページ番号（1から始まる）
 * @param limit 1ページあたりの件数
 */
export async function searchBlogsByArtistAction(
  artistName: string,
  page: number = 1,
  limit: number = 10,
) {
  return searchBlogsByArtistName(artistName, page, limit);
}

/**
 * ログインユーザが作成したブログ一覧を取得します（下書き含む）。
 *
 * @param includeDeleted 削除済みも含めるかどうか
 */
export async function getMyBlogsAction(includeDeleted: boolean = false) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return findBlogsByUserId(currentUserId, includeDeleted);
}

/**
 * ログインユーザが作成した下書きブログ一覧を取得します。
 */
export async function getMyDraftsAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();

  return prisma.blog.findMany({
    where: {
      authorId: currentUserId,
      status: "DRAFT",
      isDeleted: false,
    },
    orderBy: {
      blogCreatedTime: "desc",
    },
  });
}

/**
 * ログインユーザが作成したアーカイブブログ一覧を取得します。
 */
export async function getMyArchivesAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();

  return prisma.blog.findMany({
    where: {
      authorId: currentUserId,
      status: "ARCHIVED",
      isDeleted: false,
    },
    orderBy: {
      blogCreatedTime: "desc",
    },
  });
}

/**
 * ブログを非公開（ARCHIVED）にします。
 *
 * @param id ブログID
 */
export async function unpublishBlogAction(id: number) {
  const currentUserId = await getCurrentUserIdFromHeaders();

  // ブログの存在確認と権限チェック
  const blog = await getBlogById(id, true);

  if (blog.authorId !== currentUserId) {
    throw new ForbiddenError(
      "You do not have permission to unpublish this blog",
    );
  }

  // ブログを非公開にする
  await prisma.blog.update({
    where: { id },
    data: {
      status: "ARCHIVED",
      updatedBy: currentUserId.toString(),
    },
  });

  return { message: "ブログが非公開になりました。" };
}

/**
 * スラッグでブログ記事を取得します。
 *
 * @param slug ブログスラッグ
 */
export async function getBlogBySlugAction(slug: string) {
  return getBlogBySlug(slug);
}

/**
 * ブログのコメント一覧を取得します。
 *
 * @param id ブログID
 */
export async function getBlogCommentsAction(id: number) {
  return findCommentsByBlogId(id);
}

/**
 * ブログにいいねを付けます。
 *
 * @param id ブログID
 */
export async function likeBlogAction(id: number) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return likeBlog(currentUserId, id, currentUserId.toString());
}

/**
 * ブログのいいねを解除します。
 *
 * @param id ブログID
 */
export async function unlikeBlogAction(id: number) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  await unlikeBlog(currentUserId, id);
  return { message: "Unliked successfully" };
}

/**
 * ブログのいいね一覧を取得します。
 *
 * @param id ブログID
 */
export async function getBlogLikesAction(id: number) {
  return getLikesByBlogId(id);
}

/**
 * ログインユーザが指定ブログをいいね済みか判定します。
 *
 * @param id ブログID
 */
export async function isBlogLikedAction(id: number) {
  const currentUserId = await getCurrentUserIdFromHeaders();
  return isBlogLiked(currentUserId, id);
}

/**
 * 興味のあるブログ一覧を取得します。
 * 現在は公開ブログが少ないため、すべての公開中のブログを取得します（自分が書いたブログは除外）。
 * 今後ブログ数が増えていったら、フォローしているユーザーが作成したブログなどの条件追加を検討します。
 */
/**
 * 認証不要でおすすめブログ一覧を取得します（検索画面の初期表示用）。
 *
 * @param limit 取得件数（既定値 50）
 */
export async function getPublicRecommendedBlogsAction(limit: number = 50) {
  return getPublicRecommendedBlogs(limit);
}

export async function getInterestBlogsAction() {
  const currentUserId = await getCurrentUserIdFromHeaders();

  // 自分が書いたブログを除外して、すべての公開中のブログを取得
  return prisma.blog.findMany({
    where: {
      authorId: {
        not: currentUserId,
      },
      status: "PUBLISHED",
      isDeleted: false,
    },
    include: {
      author: true,
      blogArtists: {
        include: {
          artist: true,
        },
      },
    },
    orderBy: {
      blogCreatedTime: "desc",
    },
    take: 50, // 最大50件
  });
}
