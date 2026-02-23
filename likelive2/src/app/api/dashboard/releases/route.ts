/**
 * ダッシュボード新譜一覧 API
 *
 * ログインユーザーのお気に入りアーティストの新譜を返します。
 * クライアントサイドの「もっと見る」用に使用します。
 *
 * GET /api/dashboard/releases?limit=30&offset=0
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyGoogleToken } from "@/lib/auth/google-token-verifier";
import { findUserBySubject } from "@/lib/services/user-service";
import { findReleasesForUser } from "@/lib/services/release-service";

export async function GET(req: NextRequest) {
  // Cookie からアクセストークンを取得
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("ll_accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // トークンを検証してユーザーを特定
  const subject = await verifyGoogleToken(accessToken);
  if (!subject) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await findUserBySubject(subject);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // クエリパラメータを取得
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "30"), 100);
  const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);

  const { items, total } = await findReleasesForUser(user.id, limit, offset);

  return NextResponse.json({
    items: items.map((release) => ({
      artist: {
        spotifyArtistId: release.artist.id,
        name: release.artist.name,
        imageUrl: release.artist.imageUrl,
      },
      release: {
        id: release.id,
        spotifyReleaseId: release.spotifyReleaseId,
        name: release.name,
        type: release.releaseType,
        releaseDate: release.releaseDateNormalized
          ? release.releaseDateNormalized.toISOString().split("T")[0]
          : release.releaseDateRaw,
        releaseDatePrecision: release.releaseDatePrecision,
        coverImageUrl: release.coverImageUrl,
        spotifyUrl: release.spotifyUrl,
      },
    })),
    total,
    limit,
    offset,
  });
}
