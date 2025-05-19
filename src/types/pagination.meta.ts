export interface PaginationMetaType {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
