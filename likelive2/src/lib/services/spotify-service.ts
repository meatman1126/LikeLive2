/**
 * Spotifyサービスクラス
 */

import { env } from "../config/env";

const SPOTIFY_CLIENT_ID = env.spotifyClientId;
const SPOTIFY_CLIENT_SECRET = env.spotifyClientSecret;

/**
 * Spotifyアクセストークンを取得します。
 *
 * @returns アクセストークン情報
 */
export async function getAccessToken(): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Spotify credentials are not configured");
  }

  const authString = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authString}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
    };
  } catch (error) {
    throw new Error(
      `Failed to get Spotify access token: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export interface SpotifyArtistInfo {
  id: string;
  name: string;
  images: Array<{ url: string; height: number; width: number }>;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: string; // album | single | compilation
  release_date: string;
  release_date_precision: string; // day | month | year
  images: Array<{ url: string; height: number; width: number }>;
  external_urls: { spotify: string };
  artists: Array<{ id: string; name: string }>;
}

/**
 * 指数バックオフ付きリトライでfetchを実行します。
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error = new Error("Unknown error");
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.status === 429 || response.status >= 500) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      lastError = new Error(
        `Spotify API returned ${response.status}: ${response.statusText}`
      );
      continue;
    }
    return response;
  }
  throw lastError;
}

/**
 * アーティスト情報を取得します。
 *
 * @param artistId Spotify アーティストID
 * @param accessToken Spotify アクセストークン
 * @returns アーティスト情報
 */
export async function getArtistInfo(
  artistId: string,
  accessToken: string
): Promise<SpotifyArtistInfo> {
  const response = await fetchWithRetry(
    `https://api.spotify.com/v1/artists/${artistId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get artist info for ${artistId}: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * アーティストのアルバム一覧を取得します（album と single のみ）。
 * Spotify APIのページネーションを処理し、全件取得します。
 *
 * @param artistId Spotify アーティストID
 * @param accessToken Spotify アクセストークン
 * @returns アルバム一覧
 */
export async function getArtistAlbums(
  artistId: string,
  accessToken: string
): Promise<SpotifyAlbum[]> {
  const albums: SpotifyAlbum[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50&market=JP`;

  while (url) {
    const response = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get albums for artist ${artistId}: ${response.statusText}`
      );
    }

    const data: { items: SpotifyAlbum[]; next: string | null } =
      await response.json();
    albums.push(...data.items);
    url = data.next;
  }

  return albums;
}
