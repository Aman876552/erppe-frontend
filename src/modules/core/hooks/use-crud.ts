import { useState, useCallback, useEffect } from "react"
import { apiClient } from "../lib/api-client"
import { PaginationMeta } from "../types/api"

export interface UseCrudOptions<T> {
  endpoint: string
  initialPageSize?: number
  initialFilter?: Record<string, any>
  autoFetch?: boolean
}

export function useCrud<T = any>({
  endpoint,
  initialPageSize = 10,
  initialFilter = {},
  autoFetch = true,
}: UseCrudOptions<T>) {
  const [data, setData] = useState<T[]>([])
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState<string>("")
  const [filter, setFilter] = useState<Record<string, any>>(initialFilter)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(initialPageSize)
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: initialPageSize,
    totalItems: 0,
    totalPages: 1,
  })

  const updateFilter = useCallback((key: string, value: any) => {
    setFilter((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }, [])

  const extractDataArray = useCallback((raw: any): T[] => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (Array.isArray(raw.data)) return raw.data
    if (raw.data && Array.isArray(raw.data.data)) return raw.data.data
    if (Array.isArray(raw.items)) return raw.items
    if (Array.isArray(raw.users)) return raw.users
    if (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) return [raw.data]
    return []
  }, [])

  const extractMeta = useCallback((raw: any, extractedLength: number): PaginationMeta => {
    if (!raw) {
      return { page, pageSize, totalItems: extractedLength, totalPages: 1 }
    }

    const m = raw.meta || raw.pagination || (raw.data && typeof raw.data === "object" ? raw.data.meta || raw.data.pagination : null)
    if (m) {
      return {
        page: m.page || m.current_page || page,
        pageSize: m.pageSize || m.per_page || pageSize,
        totalItems: m.totalItems || m.total || extractedLength,
        totalPages: m.totalPages || m.last_page || Math.ceil((m.total || extractedLength) / (m.per_page || pageSize)) || 1,
      }
    }

    const total = raw.total || (raw.data && raw.data.total) || extractedLength
    return {
      page: raw.current_page || (raw.data && raw.data.current_page) || page,
      pageSize: raw.per_page || (raw.data && raw.data.per_page) || pageSize,
      totalItems: total,
      totalPages: raw.last_page || (raw.data && raw.data.last_page) || Math.ceil(total / pageSize) || 1,
    }
  }, [page, pageSize])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const searchParams = new URLSearchParams()
      if (page) searchParams.append("page", page.toString())
      if (pageSize) {
        searchParams.append("pageSize", pageSize.toString())
        searchParams.append("per_page", pageSize.toString())
        searchParams.append("limit", pageSize.toString())
      }
      if (search) {
        searchParams.append("search", search)
        searchParams.append("q", search)
      }
      Object.entries(filter).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          searchParams.append(k, String(v))
        }
      })

      const queryString = searchParams.toString()
      const url = `${endpoint}${queryString ? `?${queryString}` : ""}`
      console.log(`[USE-CRUD FETCH START] Endpoint: ${endpoint}, Full URL: ${url}`)

      const response = await apiClient.get<any>(url)
      console.log(`[USE-CRUD RAW RESPONSE] Endpoint: ${endpoint}`, response)

      const items = extractDataArray(response)
      const paginationMeta = extractMeta(response, items.length)

      console.log(`[USE-CRUD EXTRACTED DATA] Found ${items.length} items for ${endpoint}:`, items)
      console.log(`[USE-CRUD EXTRACTED META]`, paginationMeta)

      setData(items)
      setMeta(paginationMeta)
    } catch (err: any) {
      console.error(`[USE-CRUD FETCH ERROR] Endpoint: ${endpoint}`, err)
      setError(err.message || `Failed to fetch data from ${endpoint}.`)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, page, pageSize, search, filter, extractDataArray, extractMeta])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [autoFetch, fetchData])

  const getItemById = async (id: string): Promise<T | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const url = `${endpoint.endsWith("/") ? endpoint : `${endpoint}/`}${id}`
      const res = await apiClient.get<any>(url)
      const item = res.data?.data ? res.data.data : res.data ? res.data : res
      setSelectedItem(item)
      return item
    } catch (err: any) {
      const msg = err.message || `Failed to fetch record ${id}.`
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const createItem = async (payload: any): Promise<{ data: T | null; error: string | null }> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiClient.post<any>(endpoint, payload)
      const newItem = res.data?.data ? res.data.data : res.data ? res.data : res
      await fetchData()
      return { data: newItem, error: null }
    } catch (err: any) {
      const errMsg = err.message || "Failed to create record."
      setError(errMsg)
      return { data: null, error: errMsg }
    } finally {
      setIsLoading(false)
    }
  }

  const updateItem = async (id: string, payload: any): Promise<{ data: T | null; error: string | null }> => {
    setIsLoading(true)
    setError(null)
    try {
      const url = `${endpoint.endsWith("/") ? endpoint : `${endpoint}/`}${id}`
      const res = await apiClient.put<any>(url, payload)
      const updatedItem = res.data?.data ? res.data.data : res.data ? res.data : res
      setData((prev) => prev.map((item: any) => (item.id === id ? { ...item, ...updatedItem } : item)))
      return { data: updatedItem, error: null }
    } catch (err: any) {
      const errMsg = err.message || "Failed to update record."
      setError(errMsg)
      return { data: null, error: errMsg }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteItem = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    setIsLoading(true)
    setError(null)
    try {
      const url = `${endpoint.endsWith("/") ? endpoint : `${endpoint}/`}${id}`
      await apiClient.delete<any>(url)
      setData((prev) => prev.filter((item: any) => item.id !== id))
      return { success: true, error: null }
    } catch (err: any) {
      const errMsg = err.message || "Failed to delete record."
      setError(errMsg)
      return { success: false, error: errMsg }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    data,
    setData,
    selectedItem,
    setSelectedItem,
    isLoading,
    error,
    setError,
    search,
    setSearch,
    filter,
    setFilter,
    updateFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    meta,
    fetchData,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
  }
}
