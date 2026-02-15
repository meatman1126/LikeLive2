"use server";

/**
 * Artist関連のServer Actions
 */

import { getCurrentUserIdFromHeaders } from "@/lib/auth/server-actions-auth";
import { prisma } from "@/lib/prisma/client";
import { findArtistById } from "@/lib/services/artist-service";
import { NotFoundError, ValidationError } from "@/lib/utils/errors";
import { z } from "zod";

const artistUpdateSchema = z.object({
  name: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
});

/**
 * アーティスト情報を取得します。
 *
 * @param id アーティストID
 */
export async function getArtistByIdAction(id: string) {
  return findArtistById(id);
}

/**
 * アーティスト情報を更新します。
 *
 * @param id アーティストID
 * @param data 更新データ
 */
export async function updateArtistAction(
  id: string,
  data: { name?: string | null; imageUrl?: string | null }
) {
  // バリデーション
  const validationResult = artistUpdateSchema.safeParse(data);
  if (!validationResult.success) {
    throw new ValidationError("Invalid request data", validationResult.error);
  }

  // アーティストの存在確認
  const existingArtist = await prisma.artist.findUnique({
    where: { id },
  });

  if (!existingArtist) {
    throw new NotFoundError(`Artist not found with id: ${id}`);
  }

  const currentUserId = await getCurrentUserIdFromHeaders();

  // アーティスト情報を更新
  const updatedArtist = await prisma.artist.update({
    where: { id },
    data: {
      name: validationResult.data.name ?? existingArtist.name,
      imageUrl: validationResult.data.imageUrl ?? existingArtist.imageUrl,
      updatedBy: currentUserId.toString(),
    },
  });

  return updatedArtist;
}

/**
 * 指定されたアーティストを好きなユーザ一覧を取得します。
 *
 * @param id アーティストID
 */
export async function getArtistUsersAction(id: string) {
  const userArtists = await prisma.userArtist.findMany({
    where: {
      artistId: id,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return userArtists.map((ua: { user: any }) => ua.user);
}
