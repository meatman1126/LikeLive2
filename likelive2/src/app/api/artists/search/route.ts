import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAccessToken } from "@/lib/services/spotify-service";

async function getHandler(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return [];
  }

  const tokenData = await getAccessToken();
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=artist&limit=20&market=JP`,
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Spotify search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.artists?.items || []).map(
    (artist: { id: string; name: string; images: Array<{ url: string }> }) => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images?.[0]?.url || null,
    })
  );
}

export const GET = createGetHandler(getHandler);
