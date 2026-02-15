/**
 * 画像URL処理ユーティリティ
 * 
 * DBに保存されている画像URLを適切に処理します
 * - Supabase StorageのURL（http://またはhttps://で始まる）: そのまま使用
 * - ファイル名のみ: Supabase Storageの公開URLを生成
 * 
 * 注意: 旧データ（ファイル名のみ）は手動でSupabase StorageのURLに更新してください
 */

/**
 * Supabase Storageの公開URLを生成します
 * 
 * @param filename ファイル名
 * @returns Supabase Storageの公開URL
 */
function getSupabasePublicUrl(filename: string): string {
  // クライアントサイドでも使えるように、NEXT_PUBLIC_プレフィックス付きの環境変数を使用
  // .env.devで定義されている既存の環境変数を参照（重複定義を避けるため）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || "uploads";
  
  if (!supabaseUrl) {
    console.warn("SUPABASE_URL is not set. Cannot generate Supabase Storage URL.");
    return "";
  }
  
  // Supabase Storageの公開URLの形式: https://{project-ref}.supabase.co/storage/v1/object/public/{bucket}/{path}
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;
}

/**
 * 画像URLを正規化します
 * 
 * @param urlOrFilename 画像URLまたはファイル名
 * @returns 正規化された画像URL
 */
export function normalizeImageUrl(urlOrFilename: string | null | undefined): string {
  if (!urlOrFilename) {
    return "";
  }

  // 既に完全なURL（http://またはhttps://で始まる）の場合はそのまま返す
  if (urlOrFilename.startsWith("http://") || urlOrFilename.startsWith("https://")) {
    return urlOrFilename;
  }

  // ファイル名のみの場合は、Supabase Storageの公開URLを生成
  // 注意: 旧データ（ファイル名のみ）は手動でSupabase StorageのURLに更新してください
  return getSupabasePublicUrl(urlOrFilename);
}

