import type { TableDef, TableColumn } from '../types'
import { X, Plus, GripVertical } from 'lucide-react'

const SPARK_TYPES = ['STRING', 'INT', 'BIGINT', 'DOUBLE', 'FLOAT', 'BOOLEAN', 'DATE', 'TIMESTAMP_NTZ'] as const

interface Props {
  table: TableDef
  index: number
  onChange: (updated: TableDef) => void
  onRemove: () => void
}

export function DataGenSchemaCard({ table, index, onChange, onRemove }: Props) {
  const updateCol = (ci: number, field: keyof TableColumn, val: string) => {
    const cols = [...table.columns]
    cols[ci] = { ...cols[ci], [field]: val }
    onChange({ ...table, columns: cols })
  }

  const addCol = () => {
    onChange({ ...table, columns: [...table.columns, { name: 'new_column', type: 'STRING' }] })
  }

  const removeCol = (ci: number) => {
    if (table.columns.length <= 1) return
    onChange({ ...table, columns: table.columns.filter((_, i) => i !== ci) })
  }

  return (
    <div className="rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 shadow-node animate-slide-up"
         style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-dbx-gray-100 dark:border-dbx-gray-800 flex items-center gap-2">
        <GripVertical className="w-3.5 h-3.5 text-dbx-gray-300 dark:text-dbx-gray-600 flex-shrink-0" />
        <input
          type="text"
          value={table.name}
          onChange={e => onChange({ ...table, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
          className="flex-1 bg-transparent font-mono text-[13px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 outline-none border-b border-transparent hover:border-dbx-gray-300 dark:hover:border-dbx-gray-600 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors"
          spellCheck={false}
        />
        <button onClick={onRemove} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-dbx-gray-300 hover:text-red-500 transition-colors" title="Remove table">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Columns */}
      <div className="px-4 py-2">
        <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-2">columns</div>
        {table.columns.map((col, ci) => (
          <div key={ci} className="flex items-center gap-2 mb-1.5 group">
            <input
              type="text"
              value={col.name}
              onChange={e => updateCol(ci, 'name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
              className="flex-1 bg-transparent font-mono text-[12px] text-dbx-gray-600 dark:text-dbx-gray-300 outline-none border-b border-transparent hover:border-dbx-gray-300 dark:hover:border-dbx-gray-600 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors py-0.5"
              spellCheck={false}
            />
            <select
              value={col.type}
              onChange={e => updateCol(ci, 'type', e.target.value)}
              className="bg-transparent font-mono text-[10px] text-dbx-gray-400 dark:text-dbx-gray-500 outline-none border border-dbx-gray-200 dark:border-dbx-gray-700 rounded px-1.5 py-0.5 hover:border-dbx-gray-400 dark:hover:border-dbx-gray-500 cursor-pointer"
            >
              {SPARK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button
              onClick={() => removeCol(ci)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-dbx-gray-300 hover:text-red-500 transition-all"
              title="Remove column"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={addCol}
          className="flex items-center gap-1 mt-1 text-[11px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-blue dark:hover:text-dbx-green transition-colors"
        >
          <Plus className="w-3 h-3" /> add column
        </button>
      </div>

      {/* Row count + instructions */}
      <div className="px-4 py-3 border-t border-dbx-gray-100 dark:border-dbx-gray-800 space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 whitespace-nowrap">rows:</span>
          <input
            type="number"
            min={1}
            max={100}
            value={table.row_count}
            onChange={e => onChange({ ...table, row_count: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })}
            className="w-16 bg-transparent font-mono text-[12px] text-dbx-gray-600 dark:text-dbx-gray-300 outline-none border border-dbx-gray-200 dark:border-dbx-gray-700 rounded px-2 py-0.5 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors"
          />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-1">instructions</div>
          <textarea
            value={table.instructions}
            onChange={e => onChange({ ...table, instructions: e.target.value })}
            rows={2}
            className="w-full bg-transparent font-mono text-[11px] text-dbx-gray-500 dark:text-dbx-gray-400 outline-none border border-dbx-gray-200 dark:border-dbx-gray-700 rounded px-2 py-1.5 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors resize-none leading-relaxed"
            placeholder="Describe what kind of data to generate..."
          />
        </div>
      </div>
    </div>
  )
}
