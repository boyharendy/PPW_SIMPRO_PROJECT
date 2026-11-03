import { ReactNode } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export interface DataTableColumn<T = any> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  searchKey?: string;
  searchPlaceholder?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

export function DataTable<T = any>({
  columns,
  data = [],
  emptyMessage = 'Tidak ada data',
  onRowClick,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  const hasActions = onEdit || onDelete;
  const safeData = Array.isArray(data) ? data.filter((row): row is T => row != null) : [];

  return (
    <div className="overflow-x-auto rounded-2xl bg-white">
      <table className="w-full text-sm sm:text-base">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs sm:text-sm font-medium text-slate-400 tracking-wide ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
            {hasActions && (
              <th className="px-4 py-3 text-right text-xs sm:text-sm font-medium text-slate-400 tracking-wide w-24">
                Aksi
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80">
          {safeData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-14 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-4xl mb-3 opacity-25">📭</span>
                  <p className="text-sm sm:text-base font-medium text-slate-500">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            safeData.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={`bg-white hover:bg-indigo-50/30 transition-colors duration-150 group ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3.5 text-slate-700 align-middle ${col.className || ''}`}>
                    {col.render
                      ? col.render(row)
                      : ((row as Record<string, unknown>)?.[col.key] as ReactNode) ?? '-'}
                  </td>
                ))}
                {hasActions && (
                  <td className="px-4 py-3.5 text-right align-middle">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(row);
                          }}
                          className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                          title="Edit Data"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(row);
                          }}
                          className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 hover:text-rose-700 transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
