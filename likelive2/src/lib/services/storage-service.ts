/**
 * ストレージサービスクラス
 * 
 * Supabase Storageを使用してファイルを保存・取得します
 */

import { access, mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { NotFoundError } from "../utils/errors";
import { env } from "../config/env";
import { supabaseAdmin } from "../supabase/client";

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), "uploads");

/**
 * アップロードディレクトリを初期化します（ローカルストレージ用）
 */
async function ensureUploadDir(): Promise<void> {
  try {
    await access(UPLOAD_DIR);
  } catch {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * ファイルを取得します。
 * 
 * @param filename ファイル名
 * @returns ファイルのバッファ
 * @throws NotFoundError ファイルが見つからない場合
 * @deprecated Supabase Storageを使用する場合は、直接URLでアクセスしてください
 */
export async function getFile(filename: string): Promise<Buffer> {
  if (env.storageType === "supabase") {
    // Supabase Storageの場合は、直接URLでアクセスするため、この関数は使用しない
    throw new NotFoundError(
      `Supabase Storageを使用しているため、getFileは使用できません。直接URLでアクセスしてください: ${filename}`
    );
  }

  try {
    const filePath = join(UPLOAD_DIR, filename);
    return await readFile(filePath);
  } catch (error) {
    throw new NotFoundError(`ファイルが存在しません: ${filename}`);
  }
}

/**
 * ファイルを保存します。
 * 
 * @param file ファイルデータ（Buffer）
 * @param filename ファイル名
 * @returns 保存したファイルの公開URL
 */
export async function saveFile(
  file: Buffer,
  filename: string
): Promise<string> {
  if (env.storageType === "supabase") {
    // Supabase Storageにアップロード
    const { data, error } = await supabaseAdmin.storage
      .from(env.supabaseStorageBucket)
      .upload(filename, file, {
        contentType: getContentType(filename),
        upsert: true, // 既存のファイルを上書き
      });

    if (error) {
      throw new Error(`Supabase Storageへのアップロードに失敗しました: ${error.message}`);
    }

    // 公開URLを取得
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from(env.supabaseStorageBucket)
      .getPublicUrl(filename);

    if (!publicUrl) {
      throw new Error("公開URLの取得に失敗しました");
    }

    return publicUrl;
  }

  // ローカルストレージの場合（後方互換性のため）
  await ensureUploadDir();
  const filePath = join(UPLOAD_DIR, filename);
  await writeFile(filePath, file);
  return filename;
}

/**
 * ファイルの存在確認をします。
 * 
 * @param filename ファイル名
 * @returns ファイルが存在する場合true
 */
export async function fileExists(filename: string): Promise<boolean> {
  if (env.storageType === "supabase") {
    // Supabase Storageで存在確認
    // ファイル名からパスを抽出（ディレクトリ構造がある場合に対応）
    const pathParts = filename.split("/");
    const fileName = pathParts.pop() || filename;
    const folderPath = pathParts.join("/") || "";

    const { data, error } = await supabaseAdmin.storage
      .from(env.supabaseStorageBucket)
      .list(folderPath, {
        limit: 1,
        search: fileName,
      });

    return !error && (data?.length ?? 0) > 0;
  }

  // ローカルストレージの場合
  try {
    const filePath = join(UPLOAD_DIR, filename);
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * ファイルを削除します。
 * 
 * @param filename ファイル名
 */
export async function deleteFile(filename: string): Promise<void> {
  if (env.storageType === "supabase") {
    // Supabase Storageから削除
    const { error } = await supabaseAdmin.storage
      .from(env.supabaseStorageBucket)
      .remove([filename]);

    if (error) {
      throw new Error(`Supabase Storageからの削除に失敗しました: ${error.message}`);
    }
    return;
  }

  // ローカルストレージの場合（後方互換性のため）
  try {
    const filePath = join(UPLOAD_DIR, filename);
    await import("fs/promises").then((fs) => fs.unlink(filePath));
  } catch (error) {
    throw new NotFoundError(`ファイルが存在しません: ${filename}`);
  }
}

/**
 * ファイル名からContent-Typeを推測します。
 */
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    txt: "text/plain",
    json: "application/json",
  };

  return contentTypes[ext || ""] || "application/octet-stream";
}
