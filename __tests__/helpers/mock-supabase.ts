import { vi } from 'vitest'

type QueryResult = { data: unknown[]; error: null; count?: number }

/**
 * Returns a chainable Supabase query builder mock.
 * Every method returns `this` so any chain works. Awaiting it resolves to `result`.
 */
function createQueryBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {}

  const methods = [
    'select', 'eq', 'gte', 'lte', 'lt', 'not',
    'order', 'range', 'upsert', 'single',
    'delete', 'insert', 'update',
  ]
  for (const m of methods) {
    builder[m] = vi.fn().mockReturnValue(builder)
  }

  // Make the builder thenable so `await builder` works
  builder['then'] = (resolve: (v: QueryResult) => void) =>
    Promise.resolve(result).then(resolve)

  return builder
}

export function createSupabaseMock({
  user = { id: 'user-1', email: 'test@example.com' } as { id: string; email: string } | null,
  tables = {} as Record<string, QueryResult>,
} = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      const result = tables[table] ?? { data: [], error: null, count: 0 }
      return createQueryBuilder(result)
    }),
  }
}
