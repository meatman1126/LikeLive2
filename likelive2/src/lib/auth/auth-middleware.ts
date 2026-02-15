/**
 * 認証ミドルウェア
 * 
 * リクエストヘッダーに含まれる Bearer トークンを検証し、
 * 有効なトークンが存在する場合、認証情報を返す
 */

import { NextRequest } from 'next/server';
import { verifyGoogleToken } from './google-token-verifier';
import { UnauthorizedError } from '../utils/errors';

export interface AuthContext {
  subject: string;
  userId?: number;
}

/**
 * リクエストから認証情報を取得
 * 
 * @param req Next.js リクエスト
 * @returns 認証情報（subject）
 * @throws UnauthorizedError 認証に失敗した場合
 */
export async function getAuthContext(req: NextRequest): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authorization header is missing or invalid');
  }
  
  const token = authHeader.substring(7);
  const subject = await verifyGoogleToken(token);
  
  if (!subject) {
    throw new UnauthorizedError('Invalid or expired token');
  }
  
  return { subject };
}

/**
 * 認証が必要なAPI Route用のヘルパー
 * 認証に失敗した場合はエラーを投げる
 * 
 * @param req Next.js リクエスト
 * @returns 認証情報
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  return getAuthContext(req);
}

