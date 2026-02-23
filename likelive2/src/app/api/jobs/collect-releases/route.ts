/**
 * 新譜収集バッチジョブ
 *
 * Vercel Cron Jobs から呼び出されることを想定しています。
 * Authorization: Bearer {CRON_SECRET} ヘッダーで保護されています。
 *
 * 処理内容:
 * 1. お気に入り登録されているアーティストを全件取得
 * 2. Spotify API からアーティスト情報とアルバム一覧を取得
 * 3. artists テーブルを更新、releases テーブルに upsert
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import {
  getAccessToken,
  getArtistInfo,
  getArtistAlbums,
} from "@/lib/services/spotify-service";
import {
  upsertRelease,
  normalizeReleaseDate,
} from "@/lib/services/release-service";

export const maxDuration = 300; // 最大5分（Vercel Pro以上で有効）

export async function GET(req: NextRequest) {
  // CRON_SECRET による認証チェック
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // お気に入り登録されている distinct な artistId を取得
  const userArtists = await prisma.userArtist.findMany({
    select: { artistId: true },
    distinct: ["artistId"],
  });

  const artistIds = userArtists.map((ua) => ua.artistId);

  if (artistIds.length === 0) {
    return NextResponse.json({
      message: "No artists to collect",
      successCount: 0,
      failureCount: 0,
    });
  }

  // Spotify アクセストークンを取得
  let accessToken: string;
  try {
    const tokenData = await getAccessToken();
    accessToken = tokenData.access_token;
  } catch (error) {
    console.error("Failed to get Spotify access token:", error);
    return NextResponse.json(
      { error: "Failed to get Spotify access token" },
      { status: 500 }
    );
  }

  let successCount = 0;
  let failureCount = 0;

  for (const artistId of artistIds) {
    try {
      // アーティスト情報を取得して DB を更新
      try {
        const artistInfo = await getArtistInfo(artistId, accessToken);
        await prisma.artist.update({
          where: { id: artistId },
          data: {
            name: artistInfo.name,
            imageUrl: artistInfo.images?.[0]?.url ?? null,
            updatedBy: "system",
          },
        });
      } catch (artistError) {
        // アーティスト情報の更新に失敗しても、アルバム収集は続行
        console.warn(
          `Failed to update artist info for ${artistId}:`,
          artistError
        );
      }

      // アルバム一覧を取得して upsert
      const albums = await getArtistAlbums(artistId, accessToken);

      for (const album of albums) {
        const releaseDateNormalized = normalizeReleaseDate(
          album.release_date,
          album.release_date_precision
        );

        await upsertRelease({
          spotifyReleaseId: album.id,
          spotifyArtistId: artistId,
          name: album.name,
          releaseType: album.album_type,
          releaseDateRaw: album.release_date,
          releaseDatePrecision: album.release_date_precision,
          releaseDateNormalized,
          coverImageUrl: album.images?.[0]?.url ?? null,
          spotifyUrl: album.external_urls?.spotify ?? "",
        });
      }

      console.log(
        `Collected ${albums.length} releases for artist ${artistId}`
      );
      successCount++;
    } catch (error) {
      console.error(
        `Failed to collect releases for artist ${artistId}:`,
        error
      );
      failureCount++;
    }
  }

  return NextResponse.json({
    message: "Collection complete",
    totalArtists: artistIds.length,
    successCount,
    failureCount,
  });
}
