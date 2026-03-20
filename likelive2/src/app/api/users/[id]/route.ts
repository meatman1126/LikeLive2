import { NextRequest } from "next/server";
import { createGetHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getUserById } from "@/lib/services/user-service";
import { getPathParamAsNumber } from "@/lib/utils/request";

async function handler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  await getAuthenticatedUser(req);
  const id = await getPathParamAsNumber(params, "id");
  return await getUserById(id);
}

export const GET = createGetHandler(handler);
