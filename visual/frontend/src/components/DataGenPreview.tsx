import { useState } from 'react'
import type { TableDef } from '../types'

interface Props {
  table: TableDef
  rows: Record<string, unknown>[]
  onApprove: () => void
  onRegenerate: (newInstructions?: string) => void
}

function TypeBadge({ type }: { type: string }) {
  const color = type.includes('TIMESTAMP') ? 'text-dbx-amber'
    : type === 'DOUBLE' || type === 'INT' || type === 'BIGINT' || type === 'FLOAT' ? 'text-dbx-blue dark:text-dbx-green'
    : type === 'BOOLEAN' ? 'text-purple-400'
    : 'text-dbx-gray-400 dark:text-dbx-gray-500'
  return <span className={`text-[9px] font-mono ${color}`}>{type}</span>
}

export function DataGenPreview({ table, rows, onApprove, onRegenerate }: Props) {
  const [editMode, setEditMode] = useState(false)
  const [editInstructions, setEditInstructions] = useState(table.instructions)

  return (
    <div className="rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 shadow-node animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dbx-gray-100 dark:border-dbx-gray-800 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-dbx-blue dark:bg-dbx-green shadow-[0_0_4px_rgba(46,125,209,0.4)] dark:shadow-[0_0_4px_rgba(0,169,114,0.4)]" />
        <span className="text-[13px] font-semibold font-mono text-dbx-gray-800 dark:text-dbx-gray-100">{table.name}</span>
        <span className="ml-auto text-[10px] font-mono text-dbx-gray-300 dark:text-dbx-gray-600">{rows.length} rows</span>
      </div>

      {/* Data table */}
      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-[11px] font-mono">
          <thead>
            <tr className="border-b border-dbx-gray-100 dark:border-dbx-gray-800 bg-dbx-gray-50 dark:bg-dbx-gray-950">
              {table.columns.map(col => (
                <th key={col.name} className="px-3 py-2 text-left font-medium text-dbx-gray-600 dark:text-dbx-gray-300 whitespace-nowrap">
                  <div>{col.name}</div>
                  <TypeBadge type={col.type} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-dbx-gray-50 dark:border-dbx-gray-800/50 hover:bg-dbx-gray-50/50 dark:hover:bg-dbx-gray-800/30">
                {table.columns.map(col => (
                  <td key={col.name} className="px-3 py-1.5 text-dbx-gray-500 dark:text-dbx-gray-400 whitespace-nowrap max-w-[200px] truncate">
                    {String(row[col.name] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit instructions overlay */}
      {editMode && (
        <div className="px-4 py-3 border-t border-dbx-gray-100 dark:border-dbx-gray-800 bg-dbx-gray-50 dark:bg-dbx-gray-950">
          <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-1.5">refine instructions</div>
          <textarea
            value={editInstructions}
            onChange={e => setEditInstructions(e.target.value)}
            rows={3}
            className="w-full bg-white dark:bg-dbx-gray-900 font-mono text-[11px] text-dbx-gray-500 dark:text-dbx-gray-400 outline-none border border-dbx-gray-200 dark:border-dbx-gray-700 rounded px-2 py-1.5 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors resize-none leading-relaxed"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setEditMode(false); onRegenerate(editInstructions) }}
              className="px-3 py-1.5 rounded-md text-[12px] font-mono font-medium bg-dbx-red text-white hover:bg-[#E02E1C] transition-colors"
            >
              regenerate
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="px-3 py-1.5 rounded-md text-[12px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400 hover:text-dbx-gray-700 dark:hover:text-dbx-gray-200 transition-colors"
            >
              cancel
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {!editMode && (
        <div className="px-4 py-3 border-t border-dbx-gray-100 dark:border-dbx-gray-800 flex items-center gap-2">
          <button
            onClick={onApprove}
            className="px-4 py-1.5 rounded-md text-[12px] font-mono font-medium bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
          >
            [+] approve
          </button>
          <button
            onClick={() => onRegenerate()}
            className="px-3 py-1.5 rounded-md text-[12px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400 border border-dbx-gray-200 dark:border-dbx-gray-700 hover:border-dbx-gray-400 dark:hover:border-dbx-gray-500 transition-colors"
          >
            regenerate
          </button>
          <button
            onClick={() => setEditMode(true)}
            className="px-3 py-1.5 rounded-md text-[12px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400 border border-dbx-gray-200 dark:border-dbx-gray-700 hover:border-dbx-gray-400 dark:hover:border-dbx-gray-500 transition-colors"
          >
            edit & regenerate
          </button>
        </div>
      )}
    </div>
  )
}
