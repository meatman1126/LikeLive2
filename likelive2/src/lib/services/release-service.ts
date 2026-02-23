/**
 * リリース（新譜）サービス
 */

import { prisma } from "../prisma/client";
import type { Artist, Release } from "@prisma/client";

export type ReleaseWithArtist = Release & { artist: Artist };

/**
 * release_date_raw と precision から正規化された Date を生成します。
 * - precision=day   → YYYY-MM-DD そのまま
 * - precision=month → YYYY-MM-01
 * - precision=year  → YYYY-01-01
 */
export function normalizeReleaseDate(
  releaseDateRaw: string,
  precision: string
): Date | null {
  try {
    if (precision === "day") {
      return new Date(`${releaseDateRaw}T00:00:00.000Z`);
    } else if (precision === "month") {
      return new Date(`${releaseDateRaw}-01T00:00:00.000Z`);
    } else if (precision === "year") {
      return new Date(`${releaseDateRaw}-01-01T00:00:00.000Z`);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * リリース情報を upsert します。
 * spotify_release_id をユニークキーとして、存在すれば更新・なければ作成します。
 */
export async function upsertRelease(data: {
  spotifyReleaseId: string;
  spotifyArtistId: string;
  name: string;
  releaseType: string;
  releaseDateRaw: string;
  releaseDatePrecision: string;
  releaseDateNormalized: Date | null;
  coverImageUrl: string | null;
  spotifyUrl: string;
}): Promise<Release> {
  return prisma.release.upsert({
    where: { spotifyReleaseId: data.spotifyReleaseId },
    update: {
      name: data.name,
      releaseType: data.releaseType,
      releaseDateRaw: data.releaseDateRaw,
      releaseDatePrecision: data.releaseDatePrecision,
      releaseDateNormalized: data.releaseDateNormalized,
      coverImageUrl: data.coverImageUrl,
      spotifyUrl: data.spotifyUrl,
      updatedBy: "system",
    },
    create: {
      spotifyReleaseId: data.spotifyReleaseId,
      spotifyArtistId: data.spotifyArtistId,
      name: data.name,
      releaseType: data.releaseType,
      releaseDateRaw: data.releaseDateRaw,
      releaseDatePrecision: data.releaseDatePrecision,
      releaseDateNormalized: data.releaseDateNormalized,
      coverImageUrl: data.coverImageUrl,
      spotifyUrl: data.spotifyUrl,
      createdBy: "system",
      updatedBy: "system",
    },
  });
}

/**
 * 指定ユーザーのお気に入りアーティストの新譜一覧を取得します。
 * release_date_normalized の降順でソートします。
 *
 * @param userId ユーザーID
 * @param limit 取得件数（デフォルト30）
 * @param offset オフセット（デフォルト0）
 * @returns リリース一覧と総件数
 */
export async function findReleasesForUser(
  userId: number,
  limit: number = 30,
  offset: number = 0
): Promise<{ items: ReleaseWithArtist[]; total: number }> {
  const userArtists = await prisma.userArtist.findMany({
    where: { userId },
    select: { artistId: true },
  });

  const artistIds = userArtists.map((ua) => ua.artistId);

  if (artistIds.length === 0) {
    return { items: [], total: 0 };
  }

  const [items, total] = await Promise.all([
    prisma.release.findMany({
      where: { spotifyArtistId: { in: artistIds } },
      include: { artist: true },
      orderBy: [
        { releaseDateNormalized: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
      skip: offset,
    }),
    prisma.release.count({
      where: { spotifyArtistId: { in: artistIds } },
    }),
  ]);

  return { items, total };
}
