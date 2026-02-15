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
