import { NextRequest } from "next/server";
import { createGetHandler, createPutHandler, createDeleteHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { getBlogById, updateBlog, deleteBlog, incrementViewCount } from "@/lib/services/blog-service";
import { getPathParamAsNumber } from "@/lib/utils/request";
import { getRequestBody } from "@/lib/utils/request";

async function getHandler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const id = await getPathParamAsNumber(params, "id");
  await incrementViewCount(id);
  return await getBlogById(id);
}

async function putHandler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const user = await getAuthenticatedUser(req);
  const id = await getPathParamAsNumber(params, "id");
  const body = await getRequestBody(req);
  return await updateBlog(id, user.id, body as Parameters<typeof updateBlog>[2], String(user.id));
}

async function deleteHandler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const user = await getAuthenticatedUser(req);
  const id = await getPathParamAsNumber(params, "id");
  await deleteBlog(id, user.id, String(user.id));
  return { message: "Blog deleted" };
}

export const GET = createGetHandler(getHandler);
export const PUT = createPutHandler(putHandler);
export const DELETE = createDeleteHandler(deleteHandler);
