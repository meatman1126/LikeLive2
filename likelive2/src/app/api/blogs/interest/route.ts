import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { findFavoriteArtistsByUserId } from "@/lib/services/user-artist-service";
import { searchBlogsByArtistName } from "@/lib/services/blog-service";

async function handler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const artists = await findFavoriteArtistsByUserId(user.id);

  const allBlogs = [];
  for (const artist of artists) {
    if (artist.name) {
      const result = await searchBlogsByArtistName(artist.name, 1, 5);
      allBlogs.push(...result.data);
    }
  }

  const uniqueBlogs = Array.from(new Map(allBlogs.map((b) => [b.id, b])).values());
  const filtered = uniqueBlogs.filter((b: any) => b.authorId !== user.id);
  filtered.sort((a, b) => b.id - a.id);
  return filtered.slice(0, 20);
}

export const GET = createGetHandler(handler);
