import { useCallback, useEffect, useState } from 'react'
import type { TableDef, GenStep, GenStatus } from '../types'
import { DataGenSchemaCard } from './DataGenSchemaCard'
import { DataGenPreview } from './DataGenPreview'
import { GenTerminal } from './GenTerminal'
import { ArrowLeft, ArrowRight, Plus, Sparkles, Upload, AlertTriangle } from 'lucide-react'

type TriggerMode = 'schema' | 'data' | 'save' | 'provision' | null

interface Props {
  onSwitchToTables: () => void
}

export function DataGenWizard({ onSwitchToTables }: Props) {
  const [step, setStep] = useState<GenStep>('domain')
  const [status, setStatus] = useState<GenStatus | null>(null)
  const [domain, setDomain] = useState('')
  const [targetSchema, setTargetSchema] = useState('')

  // Schema step
  const [tables, setTables] = useState<TableDef[]>([])

  // Data step
  const [currentTableIdx, setCurrentTableIdx] = useState(0)
  const [currentRows, setCurrentRows] = useState<Record<string, unknown>[] | null>(null)
  const [savedTables, setSavedTables] = useState<TableDef[]>([])

  // Single trigger mechanism — increment to fire, mode to know what's running
  const [trigger, setTrigger] = useState(0)
  const [triggerMode, setTriggerMode] = useState<TriggerMode>(null)

  const fire = (mode: TriggerMode) => {
    setTriggerMode(mode)
    setTrigger(prev => prev + 1)
  }

  const isRunning = triggerMode !== null

  // Persist wizard state to backend
  const saveWizardState = useCallback((overrides?: Partial<{ step: GenStep; domain: string; tables: TableDef[]; currentTableIdx: number; savedTableNames: string[] }>) => {
    const state = {
      step: overrides?.step ?? step,
      domain: overrides?.domain ?? domain,
      tables: overrides?.tables ?? tables,
      currentTableIdx: overrides?.currentTableIdx ?? currentTableIdx,
      savedTableNames: overrides?.savedTableNames ?? savedTables.map(t => t.name),
    }
    fetch('/api/gen/wizard-state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }).catch(() => {})
  }, [step, domain, tables, currentTableIdx, savedTables])

  const clearWizardState = () => {
    fetch('/api/gen/wizard-state', { method: 'DELETE' }).catch(() => {})
  }

  // Fetch model status + restore wizard state on mount
  useEffect(() => {
    fetch('/api/gen/status')
      .then(r => r.json())
      .then(s => setStatus(s))
      .catch(() => setStatus({ modelReady: false, manifest: null }))

    // Load current target schema
    fetch('/api/env')
      .then(r => r.json())
      .then((entries: { key: string; value: string }[]) => {
        const schemaEntry = entries.find(e => e.key === 'PROJECT_UNITY_CATALOG_SCHEMA')
        if (schemaEntry?.value) setTargetSchema(schemaEntry.value)
      })
      .catch(() => {})

    // Restore wizard state if available
    fetch('/api/gen/wizard-state')
      .then(r => r.json())
      .then(saved => {
        if (!saved || !saved.step) return
        setStep(saved.step)
        if (saved.domain) setDomain(saved.domain)
        if (saved.tables?.length) setTables(saved.tables)
        if (typeof saved.currentTableIdx === 'number') setCurrentTableIdx(saved.currentTableIdx)
        if (saved.savedTableNames?.length && saved.tables?.length) {
          const names = new Set(saved.savedTableNames)
          setSavedTables(saved.tables.filter((t: TableDef) => names.has(t.name)))
        }
        // Auto-fire data generation if resuming data step
        if (saved.step === 'data' && saved.tables?.length) {
          setTimeout(() => fire('data'), 100)
        }
      })
      .catch(() => {})
  }, [])

  // Auto-save domain text (debounced)
  useEffect(() => {
    if (!domain.trim()) return
    const timer = setTimeout(() => saveWizardState({ domain }), 500)
    return () => clearTimeout(timer)
  }, [domain, saveWizardState])

  // ── Domain step ────────────────────────────────────────────────────────────

  const handleGenerateSchema = () => fire('schema')

  const handleSchemaResult = useCallback((data: unknown) => {
    const result = data as { tables: TableDef[] }
    if (result.tables) setTables(result.tables)
  }, [])

  const handleSchemaDone = useCallback((ok: boolean) => {
    setTriggerMode(null)
    if (ok) {
      setStep('schema')
      // tables are set by handleSchemaResult before this fires
      setTimeout(() => saveWizardState({ step: 'schema' }), 100)
    }
  }, [saveWizardState])

  // ── Schema step ────────────────────────────────────────────────────────────

  const updateTable = (idx: number, updated: TableDef) => {
    setTables(prev => prev.map((t, i) => i === idx ? updated : t))
  }

  const removeTable = (idx: number) => {
    setTables(prev => prev.filter((_, i) => i !== idx))
  }

  const addTable = () => {
    setTables(prev => [...prev, {
      name: `table_${prev.length + 1}`,
      columns: [{ name: 'id', type: 'STRING' }],
      row_count: 10,
      instructions: '',
    }])
  }

  const startDataGeneration = () => {
    setCurrentTableIdx(0)
    setCurrentRows(null)
    setSavedTables([])
    setStep('data')
    saveWizardState({ step: 'data', currentTableIdx: 0, savedTableNames: [] })
    fire('data')
  }

  // ── Data step ──────────────────────────────────────────────────────────────

  const currentTable = tables[currentTableIdx]

  const handleDataResult = useCallback((data: unknown) => {
    const result = data as { rows: Record<string, unknown>[] }
    if (result.rows) setCurrentRows(result.rows)
  }, [])

  const handleDataDone = useCallback((ok: boolean) => {
    setTriggerMode(null)
    if (!ok) setCurrentRows(null)
  }, [])

  const handleApprove = () => {
    if (!currentTable || !currentRows) return
    fire('save')
  }

  const handleSaveResult = useCallback(() => {}, [])

  const handleSaveDone = useCallback((ok: boolean) => {
    setTriggerMode(null)
    if (!ok) return

    const justSaved = tables[currentTableIdx]
    setSavedTables(prev => [...prev, justSaved])

    const allSavedNames = [...savedTables.map(t => t.name), justSaved.name]
    const nextIdx = currentTableIdx + 1
    if (nextIdx < tables.length) {
      setCurrentTableIdx(nextIdx)
      setCurrentRows(null)
      saveWizardState({ currentTableIdx: nextIdx, savedTableNames: allSavedNames })
      setTimeout(() => fire('data'), 50)
    } else {
      fetch('/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ USE_GEN_DATA: 'true' }),
      }).catch(() => {})
      setStep('provision')
      saveWizardState({ step: 'provision', savedTableNames: allSavedNames })
    }
  }, [currentTableIdx, tables, savedTables, saveWizardState])

  const handleRegenerate = (newInstructions?: string) => {
    if (newInstructions !== undefined) {
      const updated = { ...tables[currentTableIdx], instructions: newInstructions }
      setTables(prev => prev.map((t, i) => i === currentTableIdx ? updated : t))
    }
    setCurrentRows(null)
    fire('data')
  }

  // ── Provision step ─────────────────────────────────────────────────────────

  const handleProvision = async () => {
    // Save target schema to config.json before provisioning
    if (targetSchema.trim()) {
      await fetch('/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ PROJECT_UNITY_CATALOG_SCHEMA: targetSchema.trim() }),
      }).catch(() => {})
    }
    fire('provision')
  }

  const handleProvisionDone = useCallback((ok: boolean) => {
    setTriggerMode(null)
    if (ok) {
      setStep('done')
      clearWizardState()
    }
  }, [])

  // ── Start fresh ────────────────────────────────────────────────────────────

  const handleStartFresh = async () => {
    clearWizardState()
    await fetch('/api/gen/clear', { method: 'DELETE' }).catch(() => {})
    setStep('domain')
    setDomain('')
    setTables([])
    setCurrentTableIdx(0)
    setCurrentRows(null)
    setSavedTables([])
    setTrigger(0)
    setTriggerMode(null)
  }

  const showStartFresh = step !== 'domain' || tables.length > 0

  // ── Terminal props helper ──────────────────────────────────────────────────

  const terminalUrl = (): string => {
    if (triggerMode === 'schema') return '/api/gen/schema'
    if (triggerMode === 'save') return '/api/gen/save'
    if (triggerMode === 'provision') return '/api/gen/provision'
    return '/api/gen/data'
  }

  const terminalBody = (): Record<string, unknown> => {
    if (triggerMode === 'schema') return { domain }
    if (triggerMode === 'save') return { table: currentTable, rows: currentRows, allTables: tables }
    if (triggerMode === 'provision') return {}
    return { table: currentTable, contextTables: savedTables.map(t => ({ name: t.name, columns: t.columns })) }
  }

  const terminalOnResult = (): ((data: unknown) => void) | undefined => {
    if (triggerMode === 'schema') return handleSchemaResult
    if (triggerMode === 'save') return handleSaveResult
    if (triggerMode === 'data') return handleDataResult
    return undefined
  }

  const terminalOnDone = (): ((ok: boolean) => void) | undefined => {
    if (triggerMode === 'schema') return handleSchemaDone
    if (triggerMode === 'save') return handleSaveDone
    if (triggerMode === 'data') return handleDataDone
    if (triggerMode === 'provision') return handleProvisionDone
    return undefined
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!status) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-[12px] font-mono text-dbx-gray-400 animate-pulse">checking model status...</span>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-dbx-gray-50 dark:bg-dbx-gray-950 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Step trail */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-dbx-gray-400 dark:text-dbx-gray-500">
            {(['domain', 'schema', 'data', 'provision'] as const).map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                {i > 0 && <span className="text-dbx-gray-300 dark:text-dbx-gray-700">/</span>}
                <span className={step === s ? 'text-dbx-red dark:text-[#FF6B5A] font-medium' : ''}>
                  {s}
                </span>
              </span>
            ))}
          </div>
          {showStartFresh && !isRunning && (
            <button
              onClick={handleStartFresh}
              className="text-[10px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-red-400 transition-colors"
            >
              new generation
            </button>
          )}
        </div>

        {/* Model warning */}
        {!status.modelReady && (
          <div className="mb-6 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[13px] font-medium text-amber-800 dark:text-amber-300">Model endpoint required</div>
              <div className="text-[12px] text-amber-600 dark:text-amber-400 mt-0.5">
                Configure the model endpoint in the Setup tab before generating data.
              </div>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('switch-view', { detail: 'setup' }))
                  window.dispatchEvent(new CustomEvent('activate-step', { detail: 'model' }))
                }}
                className="mt-2 text-[12px] font-mono text-dbx-red dark:text-[#FF6B5A] hover:underline"
              >
                go to setup (model)
              </button>
            </div>
          </div>
        )}

        {/* ── Domain Step ─────────────────────────────────────────────────── */}
        {step === 'domain' && (
          <div className="animate-fade-in">
            <h3 className="text-[14px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 font-mono mb-1">
              Describe your domain
            </h3>
            <p className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mb-4">
              Tell the model about your use case, industry, and the kind of data you need.
              <br />
              It will design a schema with synthetic data for you.
            </p>

            <textarea
              value={domain}
              onChange={e => setDomain(e.target.value)}
              rows={5}
              disabled={triggerMode === 'schema' || !status.modelReady}
              placeholder="e.g. E-commerce platform with customers, products, orders, and product reviews. Include inventory tracking and shipping status."
              className="w-full bg-white dark:bg-dbx-gray-900 font-mono text-[12px] text-dbx-gray-600 dark:text-dbx-gray-300 outline-none border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-lg px-4 py-3 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors resize-none leading-relaxed disabled:opacity-50"
            />

            {triggerMode === 'schema' && (
              <div className="mt-4">
                <GenTerminal
                  url={terminalUrl()}
                  body={terminalBody()}
                  onResult={terminalOnResult()}
                  onDone={terminalOnDone()}
                  triggerKey={trigger}
                />
              </div>
            )}

            {triggerMode !== 'schema' && (
              <button
                onClick={handleGenerateSchema}
                disabled={!domain.trim() || !status.modelReady}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-mono font-medium bg-dbx-red text-white hover:bg-[#E02E1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                generate schema
              </button>
            )}
          </div>
        )}

        {/* ── Schema Step ─────────────────────────────────────────────────── */}
        {step === 'schema' && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 font-mono">
                  Review table schemas
                </h3>
                <p className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mt-0.5">
                  Edit names, columns, types, and row counts. Add or remove tables as needed.
                  <br />
                  You can always come back to refine or regenerate.
                </p>
              </div>
              <button
                onClick={() => setStep('domain')}
                className="flex items-center gap-1 text-[12px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> back
              </button>
            </div>

            <div className="space-y-4">
              {tables.map((table, i) => (
                <DataGenSchemaCard
                  key={i}
                  table={table}
                  index={i}
                  onChange={updated => updateTable(i, updated)}
                  onRemove={() => removeTable(i)}
                />
              ))}
            </div>

            <button
              onClick={addTable}
              className="mt-4 flex items-center gap-1.5 text-[12px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-blue dark:hover:text-dbx-green transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> add table
            </button>

            <div className="mt-6 flex gap-3">
              <button
                onClick={startDataGeneration}
                disabled={tables.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-mono font-medium bg-dbx-red text-white hover:bg-[#E02E1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                generate data
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Data Step ───────────────────────────────────────────────────── */}
        {step === 'data' && currentTable && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 font-mono">
                  Generate & review data
                </h3>
                <p className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mt-0.5">
                  Table {currentTableIdx + 1} of {tables.length}: <span className="text-dbx-gray-600 dark:text-dbx-gray-300">{currentTable.name}</span>
                </p>
              </div>
              <button
                onClick={() => { setStep('schema'); setTriggerMode(null) }}
                className="flex items-center gap-1 text-[12px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> back to schema
              </button>
            </div>

            {/* Table checklist */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-5 font-mono text-[11px]">
              {tables.map((t, i) => {
                const done = i < currentTableIdx
                const active = i === currentTableIdx
                return (
                  <div key={t.name} className="flex items-center gap-1.5">
                    <span className={done ? 'text-emerald-400' : active ? 'text-dbx-amber' : 'text-dbx-gray-600'}>{done ? '[+]' : '[ ]'}</span>
                    <span className={done ? 'text-emerald-400' : active ? 'text-dbx-gray-200' : 'text-dbx-gray-600'}>{t.name}</span>
                  </div>
                )
              })}
            </div>

            {/* Terminal (when generating or saving) */}
            {(triggerMode === 'data' || triggerMode === 'save') && (
              <div className="mb-4">
                <GenTerminal
                  url={terminalUrl()}
                  body={terminalBody()}
                  onResult={terminalOnResult()}
                  onDone={terminalOnDone()}
                  triggerKey={trigger}
                />
              </div>
            )}

            {/* Preview (when data ready and not running) */}
            {currentRows && !isRunning && (
              <DataGenPreview
                table={currentTable}
                rows={currentRows}
                onApprove={handleApprove}
                onRegenerate={handleRegenerate}
              />
            )}
          </div>
        )}

        {/* ── Provision Step ──────────────────────────────────────────────── */}
        {step === 'provision' && (
          <div className="animate-fade-in">
            <h3 className="text-[14px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 font-mono mb-1">
              Provision to Databricks
            </h3>
            <p className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mb-4">
              All {tables.length} table(s) saved locally. Set the target schema and provision.
            </p>

            {/* Target schema */}
            <div className="mb-4 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-2">target schema</div>
              <input
                type="text"
                value={targetSchema}
                onChange={e => setTargetSchema(e.target.value)}
                placeholder="catalog.schema"
                disabled={triggerMode === 'provision'}
                className="w-full bg-transparent font-mono text-[13px] text-dbx-gray-800 dark:text-dbx-gray-100 outline-none border border-dbx-gray-200 dark:border-dbx-gray-700 rounded px-3 py-2 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors disabled:opacity-50"
              />
              <p className="text-[10px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 mt-1.5">
                Tables will be created as {targetSchema ? `${targetSchema}.<table_name>` : '<catalog>.<schema>.<table_name>'}
              </p>
            </div>

            {/* Tables ready */}
            <div className="mb-4 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-2">tables ready</div>
              {tables.map(t => (
                <div key={t.name} className="flex items-center gap-2 py-1">
                  <span className="text-emerald-500 font-mono text-[12px]">[+]</span>
                  <span className="text-[12px] font-mono text-dbx-gray-600 dark:text-dbx-gray-300">{t.name}</span>
                  <span className="text-[10px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500">{t.columns.length} cols, {t.row_count} rows</span>
                </div>
              ))}
            </div>

            {triggerMode === 'provision' && (
              <GenTerminal
                url={terminalUrl()}
                body={terminalBody()}
                onDone={terminalOnDone()}
                triggerKey={trigger}
              />
            )}

            {triggerMode !== 'provision' && (
              <div className="flex gap-3">
                <button
                  onClick={handleProvision}
                  disabled={!targetSchema.includes('.')}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-mono font-medium bg-dbx-red text-white hover:bg-[#E02E1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  provision to databricks
                </button>
                <button
                  onClick={onSwitchToTables}
                  className="px-3 py-2 rounded-md text-[12px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400 border border-dbx-gray-200 dark:border-dbx-gray-700 hover:border-dbx-gray-400 dark:hover:border-dbx-gray-500 transition-colors"
                >
                  skip (local only)
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Done Step ───────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="animate-fade-in text-center py-12">
            <div className="text-emerald-500 font-mono text-[14px] font-medium mb-2">[+] All tables provisioned</div>
            <p className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mb-6">
              {tables.length} table(s) created in Unity Catalog
            </p>
            <button
              onClick={onSwitchToTables}
              className="px-4 py-2 rounded-md text-[12px] font-mono font-medium bg-dbx-red text-white hover:bg-[#E02E1C] transition-colors"
            >
              view tables
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
