/**
 * いいねサービスクラス
 */

import type { UserBlogLike } from "@/generated/prisma/client";
import { prisma } from "../prisma/client";
import { ConflictError, NotFoundError } from "../utils/errors";

/**
 * 指定されたブログにいいねを付けます。
 *
 * @param userId ユーザーID
 * @param blogId ブログID
 * @param createdBy 作成者
 * @returns 作成されたいいね
 * @throws ConflictError 既にいいねしている場合
 */
export async function likeBlog(
  userId: number,
  blogId: number,
  createdBy: string
): Promise<UserBlogLike> {
  // ブログの存在確認
  await prisma.blog.findUniqueOrThrow({
    where: { id: blogId },
  });

  // 既にいいねしているか確認
  const existingLike = await prisma.userBlogLike.findUnique({
    where: {
      userId_blogId: {
        userId,
        blogId,
      },
    },
  });

  if (existingLike) {
    throw new ConflictError("You have already liked this blog");
  }

  // いいねを作成
  const like = await prisma.userBlogLike.create({
    data: {
      userId,
      blogId,
      createdBy,
      updatedBy: createdBy,
    },
  });

  // ブログのいいね数を増やす
  await prisma.blog.update({
    where: { id: blogId },
    data: {
      likeCount: {
        increment: 1,
      },
    },
  });

  return like;
}

/**
 * 指定されたブログのいいねを解除します。
 *
 * @param userId ユーザーID
 * @param blogId ブログID
 * @throws NotFoundError いいねが見つからない場合
 */
export async function unlikeBlog(
  userId: number,
  blogId: number
): Promise<void> {
  // いいねの存在確認
  const like = await prisma.userBlogLike.findUnique({
    where: {
      userId_blogId: {
        userId,
        blogId,
      },
    },
  });

  if (!like) {
    throw new NotFoundError("Like not found");
  }

  // いいねを削除
  await prisma.userBlogLike.delete({
    where: {
      userId_blogId: {
        userId,
        blogId,
      },
    },
  });

  // ブログのいいね数を減らす
  await prisma.blog.update({
    where: { id: blogId },
    data: {
      likeCount: {
        decrement: 1,
      },
    },
  });
}

/**
 * 指定されたユーザーが指定されたブログにいいねしているか確認します。
 *
 * @param userId ユーザーID
 * @param blogId ブログID
 * @returns いいねしている場合はtrue、していない場合はfalse
 */
export async function isLiked(
  userId: number,
  blogId: number
): Promise<boolean> {
  const like = await prisma.userBlogLike.findUnique({
    where: {
      userId_blogId: {
        userId,
        blogId,
      },
    },
  });

  return like !== null;
}

/**
 * 指定されたブログのいいね一覧を取得します。
 *
 * @param blogId ブログID
 * @returns いいね一覧
 */
export async function getLikesByBlogId(
  blogId: number
): Promise<UserBlogLike[]> {
  return prisma.userBlogLike.findMany({
    where: {
      blogId,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * 指定されたユーザーがいいねしたブログ一覧を取得します。
 *
 * @param userId ユーザーID
 * @returns いいねしたブログ一覧
 */
export async function getLikedBlogsByUserId(userId: number) {
  const likes = await prisma.userBlogLike.findMany({
    where: {
      userId,
    },
    include: {
      blog: {
        include: {
          author: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return likes.map((like: { blog: any }) => like.blog);
}
