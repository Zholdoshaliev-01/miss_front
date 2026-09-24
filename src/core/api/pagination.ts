import type { AxiosInstance } from 'axios'

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ListResponse<T> = PaginatedResponse<T> | T[]

/** Loads every DRF page and keeps the familiar paginated response shape. */
export async function getAllPages<T>(
  client: AxiosInstance,
  url: string,
  params?: Record<string, string>,
): Promise<PaginatedResponse<T>> {
  const { data: first } = await client.get<ListResponse<T>>(url, { params })

  if (Array.isArray(first)) {
    return { count: first.length, next: null, previous: null, results: first }
  }

  const results = [...(first.results ?? [])]
  const visited = new Set<string>()
  let next = first.next

  while (next && !visited.has(next)) {
    visited.add(next)
    const { data } = await client.get<ListResponse<T>>(next)
    if (Array.isArray(data)) {
      results.push(...data)
      break
    }
    results.push(...(data.results ?? []))
    next = data.next
  }

  return {
    count: Math.max(Number(first.count) || 0, results.length),
    next: null,
    previous: null,
    results,
  }
}
