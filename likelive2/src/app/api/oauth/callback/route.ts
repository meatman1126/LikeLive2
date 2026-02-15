/**
 * Google OAuth コールバックAPI
 * 認証コードをアクセストークンに交換します。
 */

import { NextRequest } from 'next/server';
import { createPostHandler } from '@/lib/utils/api-handler';
import { getRequestBody } from '@/lib/utils/request';

interface CallbackRequest {
  code: string;
}

async function handler(req: NextRequest) {
  const body = await getRequestBody<CallbackRequest>(req);
  const { code } = body;
  
  if (!code) {
    throw new Error('Code is required');
  }
  
  const { googleClientId, googleClientSecret, oauthRedirectUri } = await import('@/lib/config/env').then(m => m.env);
  
  if (!googleClientId || !googleClientSecret || !oauthRedirectUri) {
    throw new Error('OAuth configuration is missing');
  }
  
  // Googleのトークンサーバーにリクエストを送る
  const params = new URLSearchParams();
  params.append('code', code);
  params.append('client_id', googleClientId);
  params.append('client_secret', googleClientSecret);
  params.append('redirect_uri', oauthRedirectUri);
  params.append('grant_type', 'authorization_code');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }
  
  const tokenData = await response.json();
  return tokenData;
}

export const POST = createPostHandler(handler);

