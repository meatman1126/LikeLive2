import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { findFavoriteArtistsByUserId } from "@/lib/services/user-artist-service";

async function handler(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  return await findFavoriteArtistsByUserId(user.id);
}

export const GET = createGetHandler(handler);
