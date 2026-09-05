import React from "react"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Pagination } from "./pagination"
import { ColumnHeader } from "./columns-header"
import { DataTableEmptyState } from "./empty-state"
import { LoadingSpinner } from "../loading-spinner"

export interface Column<T> {
  key: string
  title: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  isLoading?: boolean
  page?: number
  pageSize?: number
  totalItems?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  sortColumn?: string
  sortOrder?: "asc" | "desc" | null
  onSort?: (key: string) => void
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  sortColumn,
  sortOrder,
  onSort,
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-12">
        <LoadingSpinner label="Loading dataset..." size="lg" />
      </div>
    )
  }

  const showPagination =
    page !== undefined &&
    pageSize !== undefined &&
    totalItems !== undefined &&
    totalPages !== undefined &&
    onPageChange &&
    onPageSizeChange

  return (
    <div className="flex flex-col space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>
                <ColumnHeader
                  title={col.title}
                  sortable={col.sortable}
                  sortOrder={sortColumn === col.key ? sortOrder : null}
                  onSort={() => col.sortable && onSort && onSort(col.key)}
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-64 text-center">
                <DataTableEmptyState />
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? "cursor-pointer hover:bg-muted/60 transition-colors" : ""}
              >
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  )
}
