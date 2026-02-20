/**
 * ユーザーアーティストサービスクラス
 */

import { prisma } from '../prisma/client';
import type { Artist } from "@prisma/client";

/**
 * 指定されたユーザーの好きなアーティスト一覧を取得します。
 *
 * @param userId ユーザーID
 * @returns アーティスト一覧
 */
export async function findFavoriteArtistsByUserId(userId: number): Promise<Artist[]> {
  const userArtists = await prisma.userArtist.findMany({
    where: {
      userId,
    },
    include: {
      artist: true,
    },
  });
  
  return userArtists.map((ua: { artist: Artist }) => ua.artist);
}

