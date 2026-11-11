import { z } from "zod";

/**
 * Shared query-param contract for every paginated list endpoint —
 * offset/limit, not cursor-based: this API has no high-throughput,
 * rapidly-mutating feeds where cursor stability would matter, and
 * offset/limit maps directly onto the page-number UI every list view
 * in this template already uses (see DataTable's manual-pagination
 * mode). Add new list endpoints against this same schema rather than
 * inventing a per-endpoint shape.
 */
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
