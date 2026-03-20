import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { findFavoriteArtistsByUserId } from "@/lib/services/user-artist-service";
import { isFollowing } from "@/lib/services/follow-service";
import { prisma } from "@/lib/prisma/client";

async function handler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const myArtists = await findFavoriteArtistsByUserId(user.id);
  const artistIds = myArtists.map((a) => a.id);

  if (artistIds.length === 0) return [];

  const similarUsers = await prisma.userArtist.findMany({
    where: {
      artistId: { in: artistIds },
      userId: { not: user.id },
    },
    include: {
      user: true,
      artist: true,
    },
  });

  const userMap = new Map<number, { user: typeof similarUsers[0]["user"]; artists: typeof similarUsers[0]["artist"][] }>();
  for (const ua of similarUsers) {
    if (!userMap.has(ua.userId)) {
      userMap.set(ua.userId, { user: ua.user, artists: [] });
    }
    userMap.get(ua.userId)!.artists.push(ua.artist);
  }

  const results = [];
  for (const [userId, data] of userMap) {
    const following = await isFollowing(user.id, userId);
    results.push({
      userId,
      displayName: data.user.displayName,
      profileImageUrl: data.user.profileImageUrl,
      selfIntroduction: data.user.selfIntroduction,
      favoriteArtistList: data.artists,
      isFollow: following,
    });
  }

  return results;
}

export const GET = createGetHandler(handler);
