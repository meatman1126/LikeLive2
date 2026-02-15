/**
 * リクエスト関連のユーティリティ
 */

import { NextRequest } from 'next/server';

/**
 * リクエストボディをJSONとして取得
 */
export async function getRequestBody<T = unknown>(req: NextRequest): Promise<T> {
  try {
    const body = await req.json();
    return body as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * クエリパラメータを取得
 */
export function getQueryParams(req: NextRequest): URLSearchParams {
  const { searchParams } = new URL(req.url);
  return searchParams;
}

/**
 * クエリパラメータから値を取得
 */
export function getQueryParam(req: NextRequest, key: string): string | null {
  const params = getQueryParams(req);
  return params.get(key);
}

/**
 * クエリパラメータから数値を取得
 */
export function getQueryParamAsNumber(req: NextRequest, key: string): number | undefined {
  const value = getQueryParam(req, key);
  if (value === null) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

/**
 * パスパラメータから値を取得
 */
export async function getPathParam(
  params: Promise<{ [key: string]: string }>,
  key: string
): Promise<string> {
  const resolvedParams = await params;
  const value = resolvedParams[key];
  if (!value) {
    throw new Error(`Path parameter '${key}' is required`);
  }
  return value;
}

/**
 * パスパラメータから数値を取得
 */
export async function getPathParamAsNumber(
  params: Promise<{ [key: string]: string }>,
  key: string
): Promise<number> {
  const value = await getPathParam(params, key);
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`Path parameter '${key}' must be a number`);
  }
  return num;
}

