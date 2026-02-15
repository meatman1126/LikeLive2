/**
 * Google APIを呼び出すためのサービス
 */

export interface GoogleUserInfo {
  sub: string;
  name?: string;
  given_name?: string;
  email?: string;
  picture?: string;
}

/**
 * アクセストークンに紐づくGoogleユーザ情報を取得します。
 *
 * @param accessToken アクセストークン
 * @returns Googleユーザ情報
 * @throws Error アクセストークンが無効な場合
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
  
  const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user info from Google API');
  }
  
  return (await response.json()) as GoogleUserInfo;
}

