"use server";

/**
 * File関連のServer Actions
 */

import { saveFile } from "@/lib/services/storage-service";
import { ValidationError } from "@/lib/utils/errors";
import { randomUUID } from "crypto";

/**
 * ファイルを保存します。
 *
 * @param formData FormDataオブジェクト（fileフィールドを含む）
 * @returns 保存したファイルのURL（Supabase Storageの場合）またはファイル名（ローカルストレージの場合）
 */
export async function saveFileAction(formData: FormData) {
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    throw new ValidationError("保存対象のファイルが存在しません。");
  }

  // ファイル名を一意にするためにUUIDを使用
  const originalFilename = file.name;
  const fileExtension = originalFilename.split(".").pop() || "";
  const uniqueFilename = `${randomUUID()}_${originalFilename}`;

  // ファイルをバッファに変換
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // ファイルを保存（Supabase Storageの場合はURL、ローカルストレージの場合はファイル名を返す）
  const savedUrlOrFilename = await saveFile(buffer, uniqueFilename);

  // 後方互換性のため、filenameとurlの両方を返す
  return {
    filename: uniqueFilename,
    url: savedUrlOrFilename.startsWith("http") ? savedUrlOrFilename : undefined,
  };
}
