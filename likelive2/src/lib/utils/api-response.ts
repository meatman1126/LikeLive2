/**
 * APIレスポンスの統一フォーマット
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(
  message: string,
  code?: string,
  details?: unknown
): ApiResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details,
    },
  };
}

