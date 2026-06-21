import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search, 
  ChevronUp, 
  ChevronDown,
  ChevronsUpDown,
  X
} from 'lucide-react';

interface DataTableColumnFilter {
  columnId: string;
  label: string;
  allLabel?: string;
  options: { value: string; label: string }[];
}

export type { DataTableColumnFilter };

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  searchPlaceholder?: string;
  showSearch?: boolean;
  showPagination?: boolean;
  showRowSelection?: boolean;
  showColumnFilters?: boolean;
  pageSize?: number;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  columnFiltersConfig?: DataTableColumnFilter[];
}

export function DataTable<TData>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  showSearch = true,
  showPagination = true,
  showRowSelection = false,
  showColumnFilters = false,
  pageSize = 10,
  onRowSelectionChange,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  columnFiltersConfig,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const handleColumnFilterChange = (columnId: string, value: string) => {
    setColumnFilters((prev) => {
      const without = prev.filter((f) => f.id !== columnId);
      return value ? [...without, { id: columnId, value }] : without;
    });
  };

  const getColumnFilterValue = (columnId: string) =>
    (columnFilters.find((f) => f.id === columnId)?.value as string) ?? '';

  // Pre-filter data based on global search
  const filteredData = useMemo(() => {
    if (!globalFilter.trim()) return data;
    
    const searchLower = globalFilter.toLowerCase().trim();
    return data.filter((row) => {
      const rowData = row as Record<string, any>;
      return Object.values(rowData).some((value) => {
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [data, globalFilter]);

  // Add selection column if enabled
  const tableColumns = useMemo(() => {
    if (!showRowSelection) return columns;
    
    const selectionColumn: ColumnDef<TData, any> = {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="h-4 w-4 rounded border-borderColor text-primary focus:ring-primary focus:ring-offset-0"
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="h-4 w-4 rounded border-borderColor text-primary focus:ring-primary focus:ring-offset-0"
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    };
    
    return [selectionColumn, ...columns];
  }, [columns, showRowSelection]);

  const table = useReactTable({
    data: filteredData,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: showRowSelection,
    enableColumnFilters: showColumnFilters || Boolean(columnFiltersConfig?.length),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const hasActiveFilters =
    Boolean(globalFilter.trim()) ||
    columnFilters.some((filter) => Boolean(filter.value));

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, onRowSelectionChange, table]);

  const pageSizeOptions = [5, 10, 20, 50, 100];

  return (
    <div className="w-full">
      {/* Search and Controls */}
      {(showSearch || (columnFiltersConfig && columnFiltersConfig.length > 0)) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          {showSearch && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-textMuted" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-white border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textDark"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          )}

          {columnFiltersConfig && columnFiltersConfig.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              {columnFiltersConfig.map((filter) => (
                <div key={filter.columnId} className="flex items-center gap-2">
                  <label
                    htmlFor={`filter-${filter.columnId}`}
                    className="text-xs font-medium text-textMuted whitespace-nowrap"
                  >
                    {filter.label}
                  </label>
                  <select
                    id={`filter-${filter.columnId}`}
                    value={getColumnFilterValue(filter.columnId)}
                    onChange={(e) => handleColumnFilterChange(filter.columnId, e.target.value)}
                    className="px-3 py-2 bg-white border border-borderColor rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">{filter.allLabel ?? 'All'}</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          
          {showRowSelection && Object.keys(rowSelection).length > 0 && (
            <div className="text-sm text-textMuted">
              {Object.keys(rowSelection).length} row(s) selected
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="border border-borderColor rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-borderColor">
              {table.getHeaderGroups().map((headerGroup) => (
                <React.Fragment key={headerGroup.id}>
                  <tr>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider"
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-2 ${
                              header.column.getCanSort() ? 'cursor-pointer select-none hover:text-textDark' : ''
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="text-textMuted">
                                {{
                                  asc: <ChevronUp className="h-4 w-4" />,
                                  desc: <ChevronDown className="h-4 w-4" />,
                                }[header.column.getIsSorted() as string] ?? (
                                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                  {showColumnFilters && (
                    <tr className="border-t border-borderColor/60 bg-white">
                      {headerGroup.headers.map((header) => (
                        <th key={`${header.id}-filter`} className="px-4 py-2">
                          {header.column.getCanFilter() ? (
                            <input
                              type="text"
                              value={(header.column.getFilterValue() as string) ?? ''}
                              onChange={(e) => header.column.setFilterValue(e.target.value)}
                              placeholder="Filter..."
                              className="w-full px-2 py-1.5 border border-borderColor rounded text-xs font-normal normal-case tracking-normal text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : null}
                        </th>
                      ))}
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-borderColor">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: pageSize }).map((_, index) => (
                  <tr key={index}>
                    {tableColumns.map((_, colIndex) => (
                      <td key={colIndex} className="px-4 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={tableColumns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      {emptyIcon && (
                        <div className="w-16 h-16 bg-bgLight rounded-full flex items-center justify-center mb-4">
                          {emptyIcon}
                        </div>
                      )}
                      <p className="text-textMuted font-medium">{emptyMessage}</p>
                      {globalFilter && (
                        <p className="text-sm text-textMuted mt-1">
                          Try adjusting your search or filter settings
                        </p>
                      )}
                      {hasActiveFilters && !globalFilter && (
                        <p className="text-sm text-textMuted mt-1">
                          Try adjusting your column filters
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-bgLight transition-colors ${
                      row.getIsSelected() ? 'bg-primary/5' : ''
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-4 text-sm text-textDark">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && !isLoading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-textMuted">
            <span>Rows per page:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="border border-borderColor rounded-md px-2 py-1 bg-white text-textDark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-textMuted">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
              {' '}({filteredRowCount}{hasActiveFilters ? ` of ${data.length}` : ''} records)
            </span>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-md border border-borderColor bg-white hover:bg-bgLight disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4 text-textMuted" />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded-md border border-borderColor bg-white hover:bg-bgLight disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4 text-textMuted" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-md border border-borderColor bg-white hover:bg-bgLight disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4 text-textMuted" />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded-md border border-borderColor bg-white hover:bg-bgLight disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4 text-textMuted" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export column helper for convenience
export { createColumnHelper } from '@tanstack/react-table';
export type { ColumnDef } from '@tanstack/react-table';

