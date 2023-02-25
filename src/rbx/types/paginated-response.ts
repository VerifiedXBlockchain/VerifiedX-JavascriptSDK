export type PaginatedResponse<T> = {
    count: number;
    page: number;
    num_pages: number;
    results: T[];
}