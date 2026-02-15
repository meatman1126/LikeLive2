/**
 * API Route用のヘルパー関数
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppError } from './errors';
import { errorResponse, successResponse } from './api-response';
import { logger } from './logger';

/**
 * API Routeハンドラーのラッパー関数
 * エラーハンドリングとレスポンスの統一化を行う
 */
export async function apiHandler<T>(
  handler: (req: NextRequest) => Promise<T>,
  req: NextRequest
): Promise<NextResponse> {
  try {
    const data = await handler(req);
    return NextResponse.json(successResponse(data));
  } catch (error) {
    logger.error('API Error:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        errorResponse(error.message, error.code, error),
        { status: error.statusCode }
      );
    }

    // 予期しないエラー
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      errorResponse(message, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * GETリクエスト用のハンドラー
 */
export function createGetHandler<T>(
  handler: (req: NextRequest, params: { params: Promise<{ [key: string]: string }> }) => Promise<T>
) {
  return async (
    req: NextRequest,
    params: { params: Promise<{ [key: string]: string }> }
  ) => {
    return apiHandler(() => handler(req, params), req);
  };
}

/**
 * POSTリクエスト用のハンドラー
 */
export function createPostHandler<T>(
  handler: (req: NextRequest, params: { params: Promise<{ [key: string]: string }> }) => Promise<T>
) {
  return async (
    req: NextRequest,
    params: { params: Promise<{ [key: string]: string }> }
  ) => {
    return apiHandler(() => handler(req, params), req);
  };
}

/**
 * PUTリクエスト用のハンドラー
 */
export function createPutHandler<T>(
  handler: (req: NextRequest, params: { params: Promise<{ [key: string]: string }> }) => Promise<T>
) {
  return async (
    req: NextRequest,
    params: { params: Promise<{ [key: string]: string }> }
  ) => {
    return apiHandler(() => handler(req, params), req);
  };
}

/**
 * DELETEリクエスト用のハンドラー
 */
export function createDeleteHandler<T>(
  handler: (req: NextRequest, params: { params: Promise<{ [key: string]: string }> }) => Promise<T>
) {
  return async (
    req: NextRequest,
    params: { params: Promise<{ [key: string]: string }> }
  ) => {
    return apiHandler(() => handler(req, params), req);
  };
}

