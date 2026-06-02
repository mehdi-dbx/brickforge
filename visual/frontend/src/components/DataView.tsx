import { useEffect, useMemo, useState } from 'react'
import type { TableColumn } from '../types'
import { DataGenWizard } from './DataGenWizard'
import { FuncGenWizard } from './FuncGenWizard'
import { Database, Sparkles, Code, Trash2 } from 'lucide-react'

interface DynTable {
  name: string
  columns: TableColumn[]
  source: 'default' | 'generated' | 'existing'
}

function TypeBadge({ type }: { type: string }) {
  const color = type.includes('TIMESTAMP') ? 'text-dbx-amber'
    : type === 'DOUBLE' || type === 'INT' || type === 'BIGINT' || type === 'FLOAT' ? 'text-dbx-blue dark:text-dbx-green'
    : type === 'BOOLEAN' ? 'text-purple-400'
    : 'text-dbx-gray-400 dark:text-dbx-gray-500'
  return <span className={`text-[10px] font-mono ${color}`}>{type}</span>
}

function SourceBadge({ source }: { source: string }) {
  if (source === 'generated') {
    return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">generated</span>
  }
  if (source === 'existing') {
    return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">existing</span>
  }
  return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-dbx-gray-50 dark:bg-dbx-gray-800 text-dbx-gray-400 dark:text-dbx-gray-500 border border-dbx-gray-200 dark:border-dbx-gray-700">default</span>
}

type DataMode = 'tables' | 'generate' | 'generate-routines'

export function DataView() {
  const [mode, setMode] = useState<DataMode>('tables')
  const [tables, setTables] = useState<DynTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clearing, setClearing] = useState(false)
  const [useDefault, setUseDefault] = useState(true)
  const [useGen, setUseGen] = useState(false)
  const [useExisting, setUseExisting] = useState(true)
  const [existingTables, setExistingTables] = useState<DynTable[]>([])

  const fetchTables = () => {
    setLoading(true)
    setError('')
    fetch('/api/gen/tables')
      .then(r => r.json())
      .then(data => {
        setTables(data.tables || [])
        setLoading(false)
      })
      .catch(e => {
        setError(String(e))
        setLoading(false)
      })
  }

  // Load flag states on mount
  useEffect(() => {
    fetch('/api/gen/status')
      .then(r => r.json())
      .then(data => {
        setUseDefault(data.useDefault ?? true)
        setUseGen(data.useGen ?? false)
      })
      .catch(() => {})
    fetchTables()
    // Fetch existing UC tables
    fetch('/api/setup/schema-tables')
      .then(r => r.json())
      .then(data => {
        const ucTables: DynTable[] = (data.tables || []).map((t: { name: string; type: string }) => ({
          name: t.name,
          columns: [],
          source: 'existing' as const,
        }))
        setExistingTables(ucTables)
      })
      .catch(() => {})
  }, [])

  const toggleFlag = async (flag: 'USE_DEFAULT_DATA' | 'USE_GEN_DATA', value: boolean) => {
    if (flag === 'USE_DEFAULT_DATA') setUseDefault(value)
    else setUseGen(value)
    await fetch('/api/env', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [flag]: value ? 'true' : 'false' }),
    })
    // Re-fetch tables with new flags
    setTimeout(fetchTables, 200)
  }

  const switchToTables = () => {
    setMode('tables')
    fetchTables()
  }

  const hasGenerated = tables.some(t => t.source === 'generated')

  // Combine local tables + existing UC tables
  const allTables = useMemo(() => {
    const combined = [...tables]
    if (useExisting) {
      // Add existing UC tables that aren't already in the local list
      const localNames = new Set(tables.map(t => t.name))
      for (const t of existingTables) {
        if (!localNames.has(t.name)) combined.push(t)
      }
    }
    return combined
  }, [tables, existingTables, useExisting])

  const handleClearGenerated = async () => {
    setClearing(true)
    try {
      await fetch('/api/gen/clear', { method: 'DELETE' })
      fetchTables()
    } catch (e) {
      setError(String(e))
    } finally {
      setClearing(false)
    }
  }

  const isGenerate = mode === 'generate'
  const isRoutines = mode === 'generate-routines'

  return (
    <div className="h-full flex flex-col bg-dbx-gray-50 dark:bg-dbx-gray-950">
      {/* Sticky header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="max-w-5xl mx-auto flex items-start justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 font-mono">Unity Catalog Tables</h2>
            <p className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mt-1">
              Delta tables provisioned by create_all_assets.py
            </p>
            {/* Data source flags */}
            {!isGenerate && !isRoutines && (
              <div className="flex items-center gap-4 mt-2.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useDefault}
                    onChange={e => toggleFlag('USE_DEFAULT_DATA', e.target.checked)}
                    className="accent-dbx-blue w-3 h-3"
                  />
                  <span className="text-[11px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400">default data</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useGen}
                    onChange={e => toggleFlag('USE_GEN_DATA', e.target.checked)}
                    className="accent-teal-500 w-3 h-3"
                  />
                  <span className="text-[11px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400">generated data</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useExisting}
                    onChange={e => setUseExisting(e.target.checked)}
                    style={{ accentColor: '#10b981' }}
                    className="w-3 h-3"
                  />
                  <span className="text-[11px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400">existing tables</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Clear generated */}
            {!isGenerate && !isRoutines && hasGenerated && (
              <button
                onClick={handleClearGenerated}
                disabled={clearing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono text-red-400 hover:text-red-500 border border-red-200 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-700 transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-3 h-3" /> {clearing ? 'clearing...' : 'clear generated'}
              </button>
            )}

            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-dbx-gray-900 border border-dbx-gray-200 dark:border-dbx-gray-800 rounded-lg p-0.5">
              {(['tables', 'generate', 'generate-routines'] as const).map(m => {
                const active = mode === m
                const label = m === 'tables' ? 'tables' : m === 'generate' ? 'generate' : 'routines'
                const Icon = m === 'tables' ? Database : m === 'generate' ? Sparkles : Code
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-mono transition-colors ${
                      active
                        ? 'bg-dbx-gray-100 dark:bg-dbx-gray-800 text-dbx-gray-800 dark:text-dbx-gray-100 font-medium'
                        : 'text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300'
                    }`}
                  >
                    <Icon className="w-3 h-3" /> {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      {isGenerate ? (
        <DataGenWizard onSwitchToTables={switchToTables} />
      ) : isRoutines ? (
        <FuncGenWizard onSwitchToTables={switchToTables} />
      ) : (
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-5xl mx-auto">

        {/* Loading state */}
        {loading && (
          <div className="text-[12px] font-mono text-dbx-gray-400 animate-pulse">loading tables...</div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-[12px] font-mono text-red-400">[x] {error}</div>
        )}

        {/* Empty state */}
        {!loading && !error && allTables.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-dbx-gray-300 dark:text-dbx-gray-600 mb-3">
              <Database className="w-8 h-8 mx-auto" />
            </div>
            <div className="text-[13px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400 mb-1">No tables found</div>
            <p className="text-[12px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 mb-4">
              No tables found. Generate synthetic data or add CSVs to data/default/csv/.
            </p>
            <button
              onClick={() => setMode('generate')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-mono font-medium bg-dbx-red text-white hover:bg-[#E02E1C] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> generate data
            </button>
          </div>
        )}

        {/* Table cards grid */}
        {!loading && !error && allTables.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allTables.map(table => (
              <div
                key={`${table.source}-${table.name}`}
                className={`rounded-lg border bg-white dark:bg-dbx-gray-900 shadow-node hover:shadow-dbx transition-shadow duration-150 ${
                  table.source === 'generated'
                    ? 'border-teal-200 dark:border-teal-800/50'
                    : table.source === 'existing'
                      ? 'border-emerald-200 dark:border-emerald-800/50'
                      : 'border-dbx-gray-200 dark:border-dbx-gray-800'
                }`}
              >
                <div className="px-4 py-3 border-b border-dbx-gray-100 dark:border-dbx-gray-800 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    table.source === 'generated'
                      ? 'bg-teal-500 shadow-[0_0_4px_rgba(20,184,166,0.4)]'
                      : table.source === 'existing'
                        ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]'
                        : 'bg-dbx-blue dark:bg-dbx-green shadow-[0_0_4px_rgba(46,125,209,0.4)] dark:shadow-[0_0_4px_rgba(0,169,114,0.4)]'
                  }`} />
                  <span className="text-[13px] font-semibold font-mono text-dbx-gray-800 dark:text-dbx-gray-100">{table.name}</span>
                  <span className="ml-auto flex items-center gap-2">
                    <SourceBadge source={table.source} />
                    <span className="text-[10px] font-mono text-dbx-gray-300 dark:text-dbx-gray-600">{table.columns.length} cols</span>
                  </span>
                </div>
                <div className="px-4 py-2">
                  {table.columns.map((col, i) => (
                    <div
                      key={col.name}
                      className={`flex items-center justify-between py-1.5 ${
                        i < table.columns.length - 1 ? 'border-b border-dbx-gray-50 dark:border-dbx-gray-800/50' : ''
                      }`}
                    >
                      <span className="text-[12px] font-mono text-dbx-gray-600 dark:text-dbx-gray-300">{col.name}</span>
                      <TypeBadge type={col.type} />
                    </div>
                  ))}
                  {table.columns.length === 0 && (
                    <div className="text-[11px] font-mono text-dbx-gray-400 py-2">no schema found</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      )}
    </div>
  )
}
