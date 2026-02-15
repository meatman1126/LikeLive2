/**
 * ページネーション関連のユーティリティ
 */

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function getPaginationParams(
  page?: number | string,
  limit?: number | string
): PaginationOptions {
  const pageNum = page ? Number(page) : 1;
  const limitNum = limit ? Number(limit) : 10;

  return {
    page: Math.max(1, pageNum),
    limit: Math.min(100, Math.max(1, limitNum)), // 最大100件、最小1件
  };
}

export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  return {
    data,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}

