export type ListRecordGenericOptions<FilterRecordOptions> = {
  filterOptions?: FilterRecordOptions;
  paginationOptions?: {
    page?: number;
    limit?: number;
  };
  sortOptions?: Record<string, number>;
  relations?: string[];
};
