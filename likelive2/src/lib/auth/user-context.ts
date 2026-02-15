/**
 * ユーザーコンテキスト管理
 * 
 * 認証されたユーザー情報を取得するためのユーティリティ
 */

import { NextRequest } from 'next/server';
import { requireAuth } from './auth-middleware';
import { findUserBySubject } from '../services/user-service';
import { NotFoundError } from '../utils/errors';
import type { User } from '@/generated/prisma/client';

/**
 * リクエストから現在のユーザーを取得
 * 認証に失敗した場合はエラーを投げる
 * 
 * @param req Next.js リクエスト
 * @returns 現在のユーザー情報
 * @throws UnauthorizedError 認証に失敗した場合
 * @throws NotFoundError ユーザーが見つからない場合
 */
export async function getCurrentUser(req: NextRequest): Promise<User> {
  const { subject } = await requireAuth(req);
  
  const user = await findUserBySubject(subject);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  return user;
}

/**
 * リクエストから現在のユーザーIDを取得
 * 
 * @param req Next.js リクエスト
 * @returns 現在のユーザーID
 */
export async function getCurrentUserId(req: NextRequest): Promise<number> {
  const user = await getCurrentUser(req);
  return user.id;
}

