import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  // If no rows, show a nicely styled empty state
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm">
        {emptyMessage}
      </div>
    );
  }
  if (rows.length === 0) {
    return <div className="p2-table-empty">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse bg-white rounded-2xl border border-slate-200 shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
            {columns.map((col) => (
              <th key={col.key} className={col.className ? col.className : 'p-3'}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={
                onRowClick
                  ? 'hover:bg-slate-50 transition-colors cursor-pointer'
                  : undefined
              }
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.className ? col.className : 'p-3'}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
