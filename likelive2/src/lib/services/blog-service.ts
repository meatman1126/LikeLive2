/**
 * ブログサービスクラス
 */

import type { Artist, Blog, BlogCategory, BlogStatus } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../prisma/client";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import type { PaginationResult } from "../utils/pagination";
import { createNotification } from "./notification-service";

/**
 * 指定されたユーザが作成した公開中のブログ記事を取得します。
 * 取得結果はブログ作成日時の降順にソートされます。
 *
 * @param userId ユーザーID
 * @returns ブログ記事リスト
 */
export async function findPublishedBlogsByUserId(
  userId: number
): Promise<Blog[]> {
  return prisma.blog.findMany({
    where: {
      authorId: userId,
      status: "PUBLISHED",
      isDeleted: false,
    },
    orderBy: {
      blogCreatedTime: "desc",
    },
  });
}

/**
 * 指定されたIDのブログ記事を取得します。
 *
 * @param id ブログID
 * @param includeDeleted 削除済みも含めるかどうか
 * @returns ブログ記事
 * @throws NotFoundError ブログが見つからない場合
 */
export async function getBlogById(
  id: number,
  includeDeleted: boolean = false
): Promise<Blog> {
  const blog = await prisma.blog.findUnique({
    where: { id },
  });

  if (!blog) {
    throw new NotFoundError(`Blog not found with id: ${id}`);
  }

  if (!includeDeleted && blog.isDeleted) {
    throw new NotFoundError(`Blog not found with id: ${id}`);
  }

  return blog;
}

/**
 * 指定されたスラッグのブログ記事を取得します。
 *
 * @param slug ブログスラッグ
 * @returns ブログ記事
 * @throws NotFoundError ブログが見つからない場合
 */
export async function getBlogBySlug(slug: string): Promise<Blog> {
  const blog = await prisma.blog.findUnique({
    where: { slug },
  });

  if (!blog || blog.isDeleted) {
    throw new NotFoundError(`Blog not found with slug: ${slug}`);
  }

  return blog;
}

/**
 * 公開中のブログ記事一覧を取得します（ページネーション対応）。
 *
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 * @param category カテゴリでフィルタ（オプション）
 * @returns ブログ記事一覧とページネーション情報
 */
export async function getPublishedBlogs(
  page: number = 1,
  limit: number = 10,
  category?: BlogCategory
): Promise<PaginationResult<Blog>> {
  const skip = (page - 1) * limit;

  const where: {
    status: BlogStatus;
    isDeleted: boolean;
    category?: BlogCategory;
  } = {
    status: "PUBLISHED",
    isDeleted: false,
  };

  if (category) {
    where.category = category;
  }

  const [blogs, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: {
        blogCreatedTime: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.blog.count({ where }),
  ]);

  return {
    data: blogs,
    total,
    page,
    limit,
    hasMore: skip + blogs.length < total,
  };
}

/**
 * 指定されたユーザが作成したブログ記事一覧を取得します（下書き含む）。
 *
 * @param userId ユーザーID
 * @param includeDeleted 削除済みも含めるかどうか
 * @returns ブログ記事リスト
 */
export async function findBlogsByUserId(
  userId: number,
  includeDeleted: boolean = false
): Promise<Blog[]> {
  const where: {
    authorId: number;
    isDeleted?: boolean;
  } = {
    authorId: userId,
  };

  if (!includeDeleted) {
    where.isDeleted = false;
  }

  return prisma.blog.findMany({
    where,
    orderBy: {
      blogCreatedTime: "desc",
    },
  });
}

/**
 * ブログ記事を作成します。
 *
 * @param authorId 作成者ID
 * @param data ブログデータ
 * @param createdBy 作成者
 * @returns 作成されたブログ記事
 */
export async function createBlog(
  authorId: number,
  data: {
    title: string;
    content: unknown; // JSON形式
    status: BlogStatus;
    category: BlogCategory;
    tags?: string | null;
    thumbnailUrl?: string | null;
    slug?: string | null;
    setlist?: unknown | null; // JSON形式
    artistIds?: string[];
  },
  createdBy: string
): Promise<Blog> {
  // スラッグが指定されていない場合はタイトルから生成
  let slug = data.slug;
  if (!slug && data.title) {
    slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // スラッグの重複チェック
    const existingBlog = await prisma.blog.findUnique({
      where: { slug },
    });

    if (existingBlog) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  // ブログを作成
  const blog = await prisma.blog.create({
    data: {
      title: data.title,
      content: data.content as object,
      status: data.status,
      category: data.category,
      authorId,
      tags: data.tags || null,
      thumbnailUrl: data.thumbnailUrl || null,
      slug: slug || null,
      setlist:
        data.setlist != null && typeof data.setlist === "object"
          ? (data.setlist as object)
          : undefined,
      createdBy,
      updatedBy: createdBy,
    },
  });

  // アーティスト情報の登録
  if (data.artistIds && data.artistIds.length > 0) {
    for (const artistId of data.artistIds) {
      // アーティストが存在するか確認（存在しない場合はエラー）
      await prisma.artist.findUniqueOrThrow({
        where: { id: artistId },
      });

      // ブログアーティストリレーションを作成
      await prisma.blogArtist.create({
        data: {
          blogId: blog.id,
          artistId,
          createdBy,
          updatedBy: createdBy,
        },
      });
    }
  }

  // ブログが公開された場合、フォロワーに通知を送る
  if (data.status === "PUBLISHED") {
    const followers = await prisma.follow.findMany({
      where: {
        followedId: authorId,
      },
      select: {
        followerId: true,
      },
    });

    // 各フォロワーに通知を作成
    for (const follower of followers) {
      await createNotification(
        follower.followerId,
        "BLOG_CREATED",
        authorId,
        blog.id,
        null,
        createdBy
      );
    }
  }

  return blog;
}

/**
 * ブログ記事を更新します。
 *
 * @param id ブログID
 * @param authorId 作成者ID（権限チェック用）
 * @param data 更新データ
 * @param updatedBy 更新者
 * @returns 更新されたブログ記事
 * @throws NotFoundError ブログが見つからない場合
 * @throws ForbiddenError 権限がない場合
 */
export async function updateBlog(
  id: number,
  authorId: number,
  data: {
    title?: string;
    content?: unknown; // JSON形式
    status?: BlogStatus;
    category?: BlogCategory;
    tags?: string | null;
    thumbnailUrl?: string | null;
    slug?: string | null;
    setlist?: unknown | null; // JSON形式
    artistIds?: string[];
  },
  updatedBy: string
): Promise<Blog> {
  // ブログの存在確認と権限チェック
  const existingBlog = await getBlogById(id, true);

  if (existingBlog.authorId !== authorId) {
    throw new ForbiddenError("You do not have permission to update this blog");
  }

  // スラッグの重複チェック（変更される場合）
  let slug = data.slug;
  if (slug && slug !== existingBlog.slug) {
    const duplicateBlog = await prisma.blog.findUnique({
      where: { slug },
    });

    if (duplicateBlog && duplicateBlog.id !== id) {
      throw new Error(`Slug '${slug}' is already in use`);
    }
  }

  // ブログを更新（setlist の null は Prisma.JsonNull で渡す）
  const updateData: {
    title?: string;
    content?: object;
    status?: BlogStatus;
    category?: BlogCategory;
    tags?: string | null;
    thumbnailUrl?: string | null;
    slug?: string | null;
    setlist?: object | typeof Prisma.JsonNull;
    updatedBy: string;
  } = {
    updatedBy,
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content as object;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.thumbnailUrl !== undefined)
    updateData.thumbnailUrl = data.thumbnailUrl;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.setlist !== undefined)
    updateData.setlist =
      data.setlist === null ? Prisma.JsonNull : (data.setlist as object);

  const updatedBlog = await prisma.blog.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.blog.update>[0]["data"],
  });

  // アーティスト情報の更新（指定された場合）
  if (data.artistIds !== undefined) {
    // 既存のリレーションを削除
    await prisma.blogArtist.deleteMany({
      where: { blogId: id },
    });

    // 新しいリレーションを作成
    if (data.artistIds.length > 0) {
      for (const artistId of data.artistIds) {
        // アーティストが存在するか確認
        await prisma.artist.findUniqueOrThrow({
          where: { id: artistId },
        });

        await prisma.blogArtist.create({
          data: {
            blogId: id,
            artistId,
            createdBy: updatedBy,
            updatedBy,
          },
        });
      }
    }
  }

  // ブログが公開された場合（以前は公開されていなかった場合）、フォロワーに通知を送る
  if (data.status === "PUBLISHED" && existingBlog.status !== "PUBLISHED") {
    const followers = await prisma.follow.findMany({
      where: {
        followedId: authorId,
      },
      select: {
        followerId: true,
      },
    });

    // 各フォロワーに通知を作成
    for (const follower of followers) {
      await createNotification(
        follower.followerId,
        "BLOG_CREATED",
        authorId,
        id,
        null,
        updatedBy
      );
    }
  }

  return updatedBlog;
}

/**
 * ブログ記事を論理削除します。
 *
 * @param id ブログID
 * @param authorId 作成者ID（権限チェック用）
 * @param updatedBy 更新者
 * @throws NotFoundError ブログが見つからない場合
 * @throws ForbiddenError 権限がない場合
 */
export async function deleteBlog(
  id: number,
  authorId: number,
  updatedBy: string
): Promise<void> {
  const blog = await getBlogById(id, true);

  if (blog.authorId !== authorId) {
    throw new ForbiddenError("You do not have permission to delete this blog");
  }

  await prisma.blog.update({
    where: { id },
    data: {
      isDeleted: true,
      updatedBy,
    },
  });
}

/**
 * 認証不要でおすすめブログ一覧を取得します（公開中のブログを新着順に取得）。
 * 検索画面の初期表示などで利用します。
 *
 * @param limit 取得件数（既定値 50）
 */
export async function getPublicRecommendedBlogs(
  limit: number = 50
): Promise<(Blog & { author: { displayName: string | null; profileImageUrl: string | null } })[]> {
  return prisma.blog.findMany({
    where: {
      status: "PUBLISHED",
      isDeleted: false,
    },
    include: {
      author: {
        select: { displayName: true, profileImageUrl: true },
      },
    },
    orderBy: { blogCreatedTime: "desc" },
    take: limit,
  }) as Promise<(Blog & { author: { displayName: string | null; profileImageUrl: string | null } })[]>;
}

/**
 * ブログ記事の閲覧数を増やします。
 *
 * @param id ブログID
 */
export async function incrementViewCount(id: number): Promise<void> {
  await prisma.blog.update({
    where: { id },
    data: {
      viewCount: {
        increment: 1,
      },
    },
  });
}

/**
 * 指定されたブログに関連するアーティスト一覧を取得します。
 *
 * @param blogId ブログID
 * @returns アーティスト一覧
 */
export async function findArtistsByBlogId(blogId: number): Promise<Artist[]> {
  const blogArtists = await prisma.blogArtist.findMany({
    where: { blogId },
    include: { artist: true },
  });

  return blogArtists.map((ba: { artist: Artist }) => ba.artist);
}

/**
 * キーワードでブログ記事を検索します。
 *
 * @param keyword 検索キーワード
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 * @param category カテゴリでフィルタ（オプション）
 * @returns ブログ記事一覧とページネーション情報
 */
export async function searchBlogs(
  keyword: string,
  page: number = 1,
  limit: number = 10,
  category?: BlogCategory
): Promise<PaginationResult<Blog>> {
  if (!keyword || keyword.trim().length === 0) {
    return getPublishedBlogs(page, limit, category);
  }

  const skip = (page - 1) * limit;
  const searchKeyword = `%${keyword.trim()}%`;

  const where: {
    status: BlogStatus;
    isDeleted: boolean;
    category?: BlogCategory;
    OR?: Array<{
      title?: { contains: string; mode?: "insensitive" };
      tags?: { contains: string; mode?: "insensitive" };
    }>;
  } = {
    status: "PUBLISHED",
    isDeleted: false,
  };

  if (category) {
    where.category = category;
  }

  where.OR = [
    {
      title: { contains: searchKeyword.replace(/%/g, ""), mode: "insensitive" },
    },
    {
      tags: { contains: searchKeyword.replace(/%/g, ""), mode: "insensitive" },
    },
  ];

  const [blogs, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: {
        blogCreatedTime: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.blog.count({ where }),
  ]);

  return {
    data: blogs,
    total,
    page,
    limit,
    hasMore: skip + blogs.length < total,
  };
}

/**
 * アーティスト名でブログ記事を検索します（関連アーティストに指定アーティストが含まれる公開ブログ）。
 *
 * @param artistName アーティスト名（部分一致・大文字小文字区別なし）
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 * @returns ブログ記事一覧とページネーション情報
 */
export async function searchBlogsByArtistName(
  artistName: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginationResult<Blog>> {
  const term = artistName.trim();
  if (!term) {
    return getPublishedBlogs(page, limit);
  }

  const artists = await prisma.artist.findMany({
    where: {
      name: { contains: term, mode: "insensitive" },
    },
    select: { id: true },
  });
  const artistIds = artists.map((a: { id: string }) => a.id);
  if (artistIds.length === 0) {
    return { data: [], total: 0, page, limit, hasMore: false };
  }

  const skip = (page - 1) * limit;
  const [blogs, total] = await Promise.all([
    prisma.blog.findMany({
      where: {
        status: "PUBLISHED",
        isDeleted: false,
        blogArtists: {
          some: { artistId: { in: artistIds } },
        },
      },
      include: {
        author: {
          select: { displayName: true, profileImageUrl: true },
        },
      },
      orderBy: { blogCreatedTime: "desc" },
      skip,
      take: limit,
    }),
    prisma.blog.count({
      where: {
        status: "PUBLISHED",
        isDeleted: false,
        blogArtists: {
          some: { artistId: { in: artistIds } },
        },
      },
    }),
  ]);

  return {
    data: blogs,
    total,
    page,
    limit,
    hasMore: skip + blogs.length < total,
  };
}
