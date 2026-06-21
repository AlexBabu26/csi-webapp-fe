import { FilterFn } from '@tanstack/react-table';
import { DataTableColumnFilter } from '../../components/DataTable';

export const REQUEST_STATUS_FILTER: DataTableColumnFilter = {
  columnId: 'status',
  label: 'Status',
  allLabel: 'All statuses',
  options: [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ],
};

export const PAYMENT_STATUS_FILTER: DataTableColumnFilter = {
  columnId: 'display_status',
  label: 'Payment status',
  allLabel: 'All statuses',
  options: [
    { value: 'fully_paid', label: 'Fully Paid' },
    { value: 'partial', label: 'Partial Payment' },
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'rejected', label: 'Rejected' },
  ],
};

export const textIncludesFilter: FilterFn<unknown> = (row, columnId, filterValue) => {
  if (!filterValue) return true;
  const value = row.getValue(columnId);
  if (value == null) return false;
  return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
};

export const enumMatchFilter: FilterFn<unknown> = (row, columnId, filterValue) =>
  !filterValue || row.getValue(columnId) === filterValue;

export const nonSortableActionColumn = {
  enableSorting: false,
  enableColumnFilter: false,
} as const;
