import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getPathParam } from "@/lib/utils/request";
import { prisma } from "@/lib/prisma/client";

async function handler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const artistId = await getPathParam(params, "id");
  const userArtists = await prisma.userArtist.findMany({
    where: { artistId },
    include: { user: true },
  });
  return userArtists.map((ua) => ua.user);
}

export const GET = createGetHandler(handler);
