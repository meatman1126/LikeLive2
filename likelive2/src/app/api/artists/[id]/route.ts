import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { findArtistById } from "@/lib/services/artist-service";
import { getPathParam } from "@/lib/utils/request";

async function handler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const id = await getPathParam(params, "id");
  return await findArtistById(id);
}

export const GET = createGetHandler(handler);
