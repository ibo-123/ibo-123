/** Contract §3.6 paginated list envelope. */
export type Paginated<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
};

export type PaginationParams = {
  page?: number;
  page_size?: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export function paginationSearchParams(params: PaginationParams = {}): URLSearchParams {
  const search = new URLSearchParams();
  search.set('page', String(params.page ?? DEFAULT_PAGE));
  search.set('page_size', String(params.page_size ?? DEFAULT_PAGE_SIZE));
  return search;
}

export function withPagination(path: string, params: PaginationParams = {}): string {
  const query = paginationSearchParams(params).toString();
  return query ? `${path}?${query}` : path;
}

export function isPaginated<T>(value: unknown): value is Paginated<T> {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Paginated<T>;
  return (
    Array.isArray(record.items) &&
    typeof record.page === 'number' &&
    typeof record.page_size === 'number' &&
    typeof record.total === 'number'
  );
}

export function emptyPage<T>(page = DEFAULT_PAGE, page_size = DEFAULT_PAGE_SIZE): Paginated<T> {
  return { items: [], page, page_size, total: 0 };
}
