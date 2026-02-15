/**
 * アーティストサービスクラス
 */

import { prisma } from '../prisma/client';
import { NotFoundError } from '../utils/errors';
import type { Artist } from '@/generated/prisma/client';

/**
 * idに合致するアーティスト情報を取得します。
 *
 * @param id アーティストを一意に識別する文字列
 * @returns アーティスト情報
 * @throws NotFoundError アーティストが見つからない場合
 */
export async function findArtistById(id: string): Promise<Artist> {
  const artist = await prisma.artist.findUnique({
    where: { id },
  });
  
  if (!artist) {
    throw new NotFoundError(`Artist not found with id: ${id}`);
  }
  
  return artist;
}

/**
 * アーティストを新規にDBに登録します。
 * 既にDBに登録済みのアーティストの場合はinsertは行いません。
 *
 * @param artistData アーティスト情報
 * @param createdBy 作成者ID
 * @returns 登録されたアーティスト情報
 */
export async function saveArtist(
  artistData: { id: string; name?: string | null; imageUrl?: string | null },
  createdBy: string
): Promise<Artist> {
  const existingArtist = await prisma.artist.findUnique({
    where: { id: artistData.id },
  });
  
  if (existingArtist) {
    return existingArtist;
  }
  
  return prisma.artist.create({
    data: {
      id: artistData.id,
      name: artistData.name || null,
      imageUrl: artistData.imageUrl || null,
      createdBy,
      updatedBy: createdBy,
    },
  });
}

/**
 * 複数のアーティストをバッチで保存します。
 * 既にDBに登録済みのアーティストはスキップし、新規のもののみを作成します。
 *
 * @param artistsData アーティスト情報の配列
 * @param createdBy 作成者ID
 * @returns 保存されたアーティスト情報のマップ（id -> Artist）
 */
export async function saveArtistsBatch(
  artistsData: Array<{ id: string; name?: string | null; imageUrl?: string | null }>,
  createdBy: string
): Promise<Map<string, Artist>> {
  if (artistsData.length === 0) {
    return new Map();
  }

  const artistIds = artistsData.map(a => a.id);
  
  // 既存のアーティストを一括取得
  const existingArtists = await prisma.artist.findMany({
    where: { id: { in: artistIds } },
  });
  
  const existingArtistMap = new Map<string, Artist>();
  for (const artist of existingArtists) {
    existingArtistMap.set(artist.id, artist);
  }
  
  // 新規作成が必要なアーティストを特定
  const newArtists = artistsData.filter(
    artistData => !existingArtistMap.has(artistData.id)
  );
  
  // 新規アーティストを一括作成
  if (newArtists.length > 0) {
    await prisma.artist.createMany({
      data: newArtists.map(artistData => ({
        id: artistData.id,
        name: artistData.name || null,
        imageUrl: artistData.imageUrl || null,
        createdBy,
        updatedBy: createdBy,
      })),
      skipDuplicates: true,
    });
    
    // 作成したアーティストを取得してマップに追加
    const createdArtists = await prisma.artist.findMany({
      where: { id: { in: newArtists.map(a => a.id) } },
    });
    
    for (const artist of createdArtists) {
      existingArtistMap.set(artist.id, artist);
    }
  }
  
  return existingArtistMap;
}

