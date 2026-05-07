import type { RoutineDef, RoutineParam } from '../types'
import { X, Plus, GripVertical } from 'lucide-react'

const SPARK_TYPES = ['STRING', 'INT', 'BIGINT', 'DOUBLE', 'FLOAT', 'BOOLEAN', 'DATE', 'TIMESTAMP_NTZ'] as const

interface Props {
  routine: RoutineDef
  index: number
  onChange: (updated: RoutineDef) => void
  onRemove: () => void
}

export function FuncGenSchemaCard({ routine, index, onChange, onRemove }: Props) {
  const updateParam = (pi: number, field: keyof RoutineParam, val: string) => {
    const params = [...routine.parameters]
    params[pi] = { ...params[pi], [field]: val }
    onChange({ ...routine, parameters: params })
  }

  const addParam = () => {
    onChange({ ...routine, parameters: [...routine.parameters, { name: 'param', sql_type: 'STRING' }] })
  }

  const removeParam = (pi: number) => {
    onChange({ ...routine, parameters: routine.parameters.filter((_, i) => i !== pi) })
  }

  return (
    <div className="rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 shadow-node animate-slide-up"
         style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}>

      {/* Header */}
      <div className="px-4 py-3 border-b border-dbx-gray-100 dark:border-dbx-gray-800 flex items-center gap-2">
        <GripVertical className="w-3.5 h-3.5 text-dbx-gray-300 dark:text-dbx-gray-600 flex-shrink-0" />
        <input
          type="text"
          value={routine.name}
          onChange={e => onChange({ ...routine, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
          className="flex-1 bg-transparent font-mono text-[13px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 outline-none border-b border-transparent hover:border-dbx-gray-300 dark:hover:border-dbx-gray-600 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors"
          spellCheck={false}
        />
        {/* Type toggle */}
        <div className="flex items-center gap-0.5 bg-dbx-gray-100 dark:bg-dbx-gray-800 rounded-md p-0.5">
          <button
            onClick={() => onChange({ ...routine, type: 'function' })}
            className={`text-[9px] font-mono px-2 py-0.5 rounded transition-colors ${
              routine.type === 'function'
                ? 'bg-white dark:bg-dbx-gray-700 text-dbx-gray-800 dark:text-dbx-gray-100 font-medium shadow-sm'
                : 'text-dbx-gray-400 dark:text-dbx-gray-500'
            }`}
          >
            func
          </button>
          <button
            onClick={() => onChange({ ...routine, type: 'procedure' })}
            className={`text-[9px] font-mono px-2 py-0.5 rounded transition-colors ${
              routine.type === 'procedure'
                ? 'bg-white dark:bg-dbx-gray-700 text-dbx-gray-800 dark:text-dbx-gray-100 font-medium shadow-sm'
                : 'text-dbx-gray-400 dark:text-dbx-gray-500'
            }`}
          >
            proc
          </button>
        </div>
        <button onClick={onRemove} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-dbx-gray-300 hover:text-red-500 transition-colors" title="Remove routine">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Description */}
      <div className="px-4 pt-2 pb-1">
        <input
          type="text"
          value={routine.description}
          onChange={e => onChange({ ...routine, description: e.target.value })}
          placeholder="What does this routine do?"
          className="w-full bg-transparent font-mono text-[11px] text-dbx-gray-500 dark:text-dbx-gray-400 outline-none border-b border-transparent hover:border-dbx-gray-300 dark:hover:border-dbx-gray-600 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors py-0.5"
        />
      </div>

      {/* Parameters */}
      <div className="px-4 py-2">
        <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-2">parameters</div>
        {routine.parameters.map((p, pi) => (
          <div key={pi} className="flex items-center gap-2 mb-1.5 group">
            <input
              type="text"
              value={p.name}
              onChange={e => updateParam(pi, 'name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
              className="flex-1 bg-transparent font-mono text-[12px] text-dbx-gray-600 dark:text-dbx-gray-300 outline-none border-b border-transparent hover:border-dbx-gray-300 dark:hover:border-dbx-gray-600 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors py-0.5"
              spellCheck={false}
            />
            <select
              value={p.sql_type}
              onChange={e => updateParam(pi, 'sql_type', e.target.value)}
              className="bg-transparent font-mono text-[10px] text-dbx-gray-400 dark:text-dbx-gray-500 outline-none border border-dbx-gray-200 dark:border-dbx-gray-700 rounded px-1.5 py-0.5 hover:border-dbx-gray-400 dark:hover:border-dbx-gray-500 cursor-pointer"
            >
              {SPARK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button
              onClick={() => removeParam(pi)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-dbx-gray-300 hover:text-red-500 transition-all"
              title="Remove parameter"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={addParam}
          className="flex items-center gap-1 mt-1 text-[11px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-blue dark:hover:text-dbx-green transition-colors"
        >
          <Plus className="w-3 h-3" /> add parameter
        </button>
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 border-t border-dbx-gray-100 dark:border-dbx-gray-800">
        <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-1">instructions</div>
        <textarea
          value={routine.instructions}
          onChange={e => onChange({ ...routine, instructions: e.target.value })}
          rows={2}
          className="w-full bg-transparent font-mono text-[11px] text-dbx-gray-500 dark:text-dbx-gray-400 outline-none border border-dbx-gray-200 dark:border-dbx-gray-700 rounded px-2 py-1.5 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors resize-none leading-relaxed"
          placeholder="Describe the SQL logic, filtering, joins..."
        />
      </div>
    </div>
  )
}
