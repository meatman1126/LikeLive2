/**
 * ソート関連のユーティリティ
 */

// Prisma型は必要に応じてインポート
// import { Prisma } from '../../../../generated/prisma';

export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: string;
  order: SortOrder;
}

/**
 * ソート文字列を解析してPrismaのソートオプションに変換
 * 例: "createdAt:desc" -> { createdAt: 'desc' }
 * 例: "title:asc" -> { title: 'asc' }
 */
export function parseSortString(sortString?: string): Record<string, SortOrder> {
  if (!sortString) {
    return { createdAt: 'desc' }; // デフォルトは作成日時の降順
  }

  const [field, order] = sortString.split(':');
  const sortOrder: SortOrder = order === 'asc' ? 'asc' : 'desc';

  return {
    [field]: sortOrder,
  };
}

/**
 * 複数のソート条件を解析
 * 例: "createdAt:desc,title:asc" -> { createdAt: 'desc', title: 'asc' }
 */
export function parseMultipleSortString(sortString?: string): Record<string, SortOrder> {
  if (!sortString) {
    return { createdAt: 'desc' };
  }

  const sortOptions: Record<string, SortOrder> = {};
  const parts = sortString.split(',');

  for (const part of parts) {
    const [field, order] = part.trim().split(':');
    if (field) {
      sortOptions[field] = order === 'asc' ? 'asc' : 'desc';
    }
  }

  return Object.keys(sortOptions).length > 0 ? sortOptions : { createdAt: 'desc' };
}

