import { ReactNode } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'Tidak ada data',
  onRowClick,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  const hasActions = onEdit || onDelete;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
            {hasActions && (
              <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">
                Aksi
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-16 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-4xl mb-3 opacity-20">📭</span>
                  <p>{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={`bg-white hover:bg-slate-50 transition-all duration-200 group ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-4 text-slate-700 ${col.className || ''}`}>
                    {col.render
                      ? col.render(row)
                      : (row[col.key] as ReactNode) ?? '-'}
                  </td>
                ))}
                {hasActions && (
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                          className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 hover:text-blue-700 transition-colors"
                          title="Edit Data"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                          className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 hover:text-rose-700 transition-colors"
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
