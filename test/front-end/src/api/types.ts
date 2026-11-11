/**
 * Every backend response follows this envelope
 * (back-end/src/utils/apiResponse.ts).
 */
export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Shape every paginated list endpoint returns alongside its items
 * (back-end/src/data-transfer-object/pagination.dto.ts) — offset/limit,
 * with `total` reflecting the whole collection, not just this page.
 */
export interface Pagination {
  limit: number;
  offset: number;
  total: number;
}
