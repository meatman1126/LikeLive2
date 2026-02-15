/**
 * Google OAuth 2.0 トークン検証サービス
 * 
 * 指定されたトークンを検証し、GoogleのユーザID（sub）を返す
 */

export interface GoogleTokenInfo {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

/**
 * Google OAuth トークンを検証し、GoogleのユーザID（sub）を返す
 * 
 * @param token Google OAuth アクセストークン
 * @returns GoogleのユーザID（sub）または null（無効なトークンの場合）
 */
export async function verifyGoogleToken(token: string): Promise<string | null> {
  try {
    const url = `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = (await response.json()) as GoogleTokenInfo;
    
    // 検証成功時、GoogleのユーザID（sub）を返す
    if (data && data.sub) {
      return data.sub;
    }
    
    return null;
  } catch (error) {
    // トークンが無効な場合やその他のエラー
    return null;
  }
}

