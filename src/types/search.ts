export interface FilterOption {
  value: string;
  label: string;
}

export interface SearchParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiListResponse<T> {
  ok: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  error?: string;
}

export interface ApiDetailResponse<T> {
  ok: boolean;
  data: T | null;
  error?: string;
}

export interface ApiFiltersResponse {
  ok: boolean;
  filters: Record<string, FilterOption[]>;
  error?: string;
}
