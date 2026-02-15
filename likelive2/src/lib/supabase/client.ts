/**
 * Supabaseクライアント
 * 
 * サーバーサイドでのみ使用するSupabaseクライアント
 * Secret keyを使用して、Storageへの書き込み権限を持つ
 */

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";

/**
 * サーバーサイド用のSupabaseクライアント
 * Secret keyを使用して、すべての権限でアクセス可能
 */
export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * クライアントサイド用のSupabaseクライアント（必要に応じて）
 * Publishable keyを使用して、公開リソースにアクセス可能
 */
export const supabase = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey
);

