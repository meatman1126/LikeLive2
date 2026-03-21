import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { saveFile } from "@/lib/services/storage-service";
import { randomUUID } from "crypto";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

export async function POST(req: NextRequest) {
  try {
    await getAuthenticatedUser(req);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(errorResponse("ファイルが存在しません", "VALIDATION_ERROR"), {
        status: 400,
      });
    }

    const ext = file.name.split(".").pop() || "";
    const uniqueFilename = `${randomUUID()}_${file.name}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const savedUrlOrFilename = await saveFile(buffer, uniqueFilename);

    return NextResponse.json(
      successResponse({
        filename: uniqueFilename,
        url: savedUrlOrFilename.startsWith("http")
          ? savedUrlOrFilename
          : `/api/public/files/${uniqueFilename}`,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(errorResponse(message, "INTERNAL_ERROR"), {
      status: 500,
    });
  }
}
