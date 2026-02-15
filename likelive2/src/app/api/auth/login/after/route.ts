/**
 * ログイン後のユーザー情報取得API
 * 初回ログインでDB未登録の場合DB登録を行います。
 */

import { NextRequest } from 'next/server';
import { createPostHandler } from '@/lib/utils/api-handler';
import { getAuthContext } from '@/lib/auth/auth-middleware';
import { getGoogleUserInfo } from '@/lib/auth/google-service';
import { findUserBySubject, registerUser } from '@/lib/services/user-service';

async function handler(req: NextRequest) {
  // 認証情報を取得
  const { subject } = await getAuthContext(req);
  
  // 既存ユーザーを確認
  let user = await findUserBySubject(subject);
  
  // ユーザーが存在しない場合、新規に登録
  if (!user) {
    // AuthorizationヘッダーからBearerトークンを抽出
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid Authorization header');
    }
    
    const accessToken = authHeader.substring(7);
    
    // Google APIを呼び出してユーザー情報を取得
    const googleUserInfo = await getGoogleUserInfo(accessToken);
    
    // ユーザーを登録
    user = await registerUser(
      subject,
      googleUserInfo.given_name || googleUserInfo.name || undefined
    );
  }
  
  return user;
}

export const POST = createPostHandler(handler);

