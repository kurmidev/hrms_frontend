import { useState, useCallback } from 'react'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

export function usePagination(initialLimit = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const [limit] = useState(initialLimit)

  const reset = useCallback(() => setPage(1), [])

  return { page, limit, setPage, reset }
}
