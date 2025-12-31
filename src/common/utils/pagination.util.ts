import { PaginatedResult, PaginationMeta } from '../interfaces/paginated-result.interface';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  skip: number;
  take: number;
}

export function getPaginationParams(options: PaginationOptions): PaginationParams {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));

  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  options: PaginationOptions,
): PaginatedResult<T> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const totalPages = Math.ceil(total / limit);

  const meta: PaginationMeta = {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };

  return {
    data,
    meta,
  };
}
