/**
 * Google OAuth 2.0 トークン検証サービス
 * 
 * 指定されたトークンを検証し、GoogleのユーザID（sub）を返す。
 * インメモリキャッシュにより、同一トークンの重複検証を防ぐ。
 */

export interface GoogleTokenInfo {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

const CACHE_TTL = 5 * 60 * 1000; // 5分
const MAX_CACHE_SIZE = 200;

const tokenCache = new Map<string, { subject: string; expiresAt: number }>();

function evictExpiredEntries() {
  const now = Date.now();
  for (const [key, value] of tokenCache) {
    if (value.expiresAt <= now) tokenCache.delete(key);
  }
}

/**
 * Google OAuth トークンを検証し、GoogleのユーザID（sub）を返す
 * 
 * @param token Google OAuth アクセストークン
 * @returns GoogleのユーザID（sub）または null（無効なトークンの場合）
 */
export async function verifyGoogleToken(token: string): Promise<string | null> {
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.subject;
  }

  try {
    const url = `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      tokenCache.delete(token);
      return null;
    }
    
    const data = (await response.json()) as GoogleTokenInfo;
    
    if (data && data.sub) {
      tokenCache.set(token, { subject: data.sub, expiresAt: Date.now() + CACHE_TTL });
      if (tokenCache.size > MAX_CACHE_SIZE) evictExpiredEntries();
      return data.sub;
    }
    
    return null;
  } catch {
    return null;
  }
}

