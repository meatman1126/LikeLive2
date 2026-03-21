import { NextRequest } from "next/server";
import { createGetHandler, createPutHandler, createDeleteHandler } from "@/lib/utils/api-handler";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { updateBlog, deleteBlog, incrementViewCount } from "@/lib/services/blog-service";
import { getPathParamAsNumber } from "@/lib/utils/request";
import { getRequestBody } from "@/lib/utils/request";
import { prisma } from "@/lib/prisma/client";

async function getHandler(req: NextRequest, { params }: { params: Promise<{ [key: string]: string }> }) {
  const id = await getPathParamAsNumber(params, "id");
  await incrementViewCount(id);
  const blog = await prisma.blog.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, displayName: true, profileImageUrl: true },
      },
      blogArtists: {
        include: {
          artist: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      },
    },
  });
  if (!blog || blog.isDeleted) {
    throw new Error("Blog not found");
  }
  return blog;
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
