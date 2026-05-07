import { useCallback, useEffect, useState } from 'react'
import type { RoutineDef, TableDef, FuncGenStep } from '../types'
import { FuncGenSchemaCard } from './FuncGenSchemaCard'
import { GenTerminal } from './GenTerminal'
import { ArrowLeft, ArrowRight, Plus, Sparkles, Upload, AlertTriangle, Check, RotateCcw } from 'lucide-react'

type TriggerMode = 'schema' | 'sql' | 'save' | 'provision' | null

interface Props {
  onSwitchToTables: () => void
}

export function FuncGenWizard({ onSwitchToTables }: Props) {
  const [step, setStep] = useState<FuncGenStep>('domain')
  const [modelReady, setModelReady] = useState(false)
  const [domain, setDomain] = useState('')
  const [targetSchema, setTargetSchema] = useState('')

  // Table schemas from data gen (for LLM context)
  const [tableSchemas, setTableSchemas] = useState<TableDef[]>([])

  // Schema step
  const [routines, setRoutines] = useState<RoutineDef[]>([])

  // SQL step
  const [currentIdx, setCurrentIdx] = useState(0)
  const [currentSql, setCurrentSql] = useState<string | null>(null)
  const [savedRoutines, setSavedRoutines] = useState<RoutineDef[]>([])

  // Trigger mechanism
  const [trigger, setTrigger] = useState(0)
  const [triggerMode, setTriggerMode] = useState<TriggerMode>(null)

  const fire = (mode: TriggerMode) => {
    setTriggerMode(mode)
    setTrigger(prev => prev + 1)
  }

  const isRunning = triggerMode !== null

  // Persist wizard state
  const saveWizardState = useCallback((overrides?: Partial<{ step: FuncGenStep; domain: string; routines: RoutineDef[]; currentIdx: number; savedNames: string[] }>) => {
    const state = {
      step: overrides?.step ?? step,
      domain: overrides?.domain ?? domain,
      routines: overrides?.routines ?? routines,
      currentIdx: overrides?.currentIdx ?? currentIdx,
      savedNames: overrides?.savedNames ?? savedRoutines.map(r => r.name),
    }
    fetch('/api/gen/routine-wizard-state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    }).catch(() => {})
  }, [step, domain, routines, currentIdx, savedRoutines])

  const clearWizardState = () => {
    fetch('/api/gen/routine-wizard-state', { method: 'DELETE' }).catch(() => {})
  }

  // Init
  useEffect(() => {
    fetch('/api/gen/routine-status')
      .then(r => r.json())
      .then(s => {
        setModelReady(s.modelReady)
        if (s.tableSchemas?.length) setTableSchemas(s.tableSchemas)
      })
      .catch(() => setModelReady(false))

    fetch('/api/env')
      .then(r => r.json())
      .then((entries: { key: string; value: string }[]) => {
        const schemaEntry = entries.find(e => e.key === 'PROJECT_UNITY_CATALOG_SCHEMA')
        if (schemaEntry?.value) setTargetSchema(schemaEntry.value)
      })
      .catch(() => {})

    // Restore wizard state
    fetch('/api/gen/routine-wizard-state')
      .then(r => r.json())
      .then(saved => {
        if (!saved || !saved.step) return
        setStep(saved.step)
        if (saved.domain) setDomain(saved.domain)
        if (saved.routines?.length) setRoutines(saved.routines)
        if (typeof saved.currentIdx === 'number') setCurrentIdx(saved.currentIdx)
        if (saved.savedNames?.length && saved.routines?.length) {
          const names = new Set(saved.savedNames)
          setSavedRoutines(saved.routines.filter((r: RoutineDef) => names.has(r.name)))
        }
      })
      .catch(() => {})
  }, [])

  // ── Domain step ────────────────────────────────────────────────────────────

  const handleGenerateSchema = () => fire('schema')

  const handleSchemaResult = useCallback((data: unknown) => {
    const result = data as { routines: RoutineDef[] }
    if (result.routines) setRoutines(result.routines)
  }, [])

  const handleSchemaDone = useCallback((ok: boolean) => {
    setTriggerMode(null)
    if (ok) {
      setStep('schema')
      setTimeout(() => saveWizardState({ step: 'schema' }), 100)
    }
  }, [saveWizardState])

  // ── Schema step ────────────────────────────────────────────────────────────

  const updateRoutine = (idx: number, updated: RoutineDef) => {
    setRoutines(prev => prev.map((r, i) => i === idx ? updated : r))
  }

  const removeRoutine = (idx: number) => {
    setRoutines(prev => prev.filter((_, i) => i !== idx))
  }

  const addRoutine = () => {
    setRoutines(prev => [...prev, {
      name: `routine_${prev.length + 1}`,
      type: 'function',
      description: '',
      parameters: [{ name: 'param', sql_type: 'STRING' }],
      tables_referenced: [],
      instructions: '',
    }])
  }

  const startSqlGeneration = () => {
    setCurrentIdx(0)
    setCurrentSql(null)
    setSavedRoutines([])
    setStep('sql')
    saveWizardState({ step: 'sql', currentIdx: 0, savedNames: [] })
    fire('sql')
  }

  // ── SQL step ───────────────────────────────────────────────────────────────

  const currentRoutine = routines[currentIdx]

  const handleSqlResult = useCallback((data: unknown) => {
    const result = data as { sql: string }
    if (result.sql) setCurrentSql(result.sql)
  }, [])

  const handleSqlDone = useCallback((ok: boolean) => {
    setTriggerMode(null)
    if (!ok) setCurrentSql(null)
  }, [])

  const handleApproveSql = () => {
    if (!currentRoutine || !currentSql) return
    fire('save')
  }

  const handleSaveResult = useCallback(() => {}, [])

  const handleSaveDone = useCallback((ok: boolean) => {
    setTriggerMode(null)
    if (!ok) return

    const justSaved = { ...routines[currentIdx], sql: currentSql || undefined }
    setSavedRoutines(prev => [...prev, justSaved])

    const allSavedNames = [...savedRoutines.map(r => r.name), justSaved.name]
    const nextIdx = currentIdx + 1
    if (nextIdx < routines.length) {
      setCurrentIdx(nextIdx)
      setCurrentSql(null)
      saveWizardState({ currentIdx: nextIdx, savedNames: allSavedNames })
      setTimeout(() => fire('sql'), 50)
    } else {
      setStep('provision')
      saveWizardState({ step: 'provision', savedNames: allSavedNames })
    }
  }, [currentIdx, currentSql, routines, savedRoutines, saveWizardState])

  const handleRegenerateSql = (newInstructions?: string) => {
    if (newInstructions !== undefined) {
      const updated = { ...routines[currentIdx], instructions: newInstructions }
      setRoutines(prev => prev.map((r, i) => i === currentIdx ? updated : r))
    }
    setCurrentSql(null)
    fire('sql')
  }

  // ── Provision step ─────────────────────────────────────────────────────────

  const handleProvision = async () => {
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
    await fetch('/api/gen/clear-routines', { method: 'DELETE' }).catch(() => {})
    setStep('domain')
    setDomain('')
    setRoutines([])
    setCurrentIdx(0)
    setCurrentSql(null)
    setSavedRoutines([])
    setTrigger(0)
    setTriggerMode(null)
  }

  const showStartFresh = step !== 'domain' || routines.length > 0

  // ── Terminal helpers ───────────────────────────────────────────────────────

  const terminalUrl = (): string => {
    if (triggerMode === 'schema') return '/api/gen/routine-schema'
    if (triggerMode === 'save') return '/api/gen/routine-save'
    if (triggerMode === 'provision') return '/api/gen/routine-provision'
    return '/api/gen/routine-sql'
  }

  const terminalBody = (): Record<string, unknown> => {
    if (triggerMode === 'schema') return { domain, tableSchemas }
    if (triggerMode === 'save') return { routine: currentRoutine, sql: currentSql, allRoutines: routines }
    if (triggerMode === 'provision') return {}
    return { routine: currentRoutine, tableSchemas }
  }

  const terminalOnResult = (): ((data: unknown) => void) | undefined => {
    if (triggerMode === 'schema') return handleSchemaResult
    if (triggerMode === 'save') return handleSaveResult
    if (triggerMode === 'sql') return handleSqlResult
    return undefined
  }

  const terminalOnDone = (): ((ok: boolean) => void) | undefined => {
    if (triggerMode === 'schema') return handleSchemaDone
    if (triggerMode === 'save') return handleSaveDone
    if (triggerMode === 'sql') return handleSqlDone
    if (triggerMode === 'provision') return handleProvisionDone
    return undefined
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto bg-dbx-gray-50 dark:bg-dbx-gray-950 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Step trail */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-dbx-gray-400 dark:text-dbx-gray-500">
            {(['domain', 'schema', 'sql', 'provision'] as const).map((s, i) => (
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
              start fresh
            </button>
          )}
        </div>

        {/* Model warning */}
        {!modelReady && (
          <div className="mb-6 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-start gap-3 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-[13px] font-medium text-amber-800 dark:text-amber-300">Model endpoint required</div>
              <div className="text-[12px] text-amber-600 dark:text-amber-400 mt-0.5">
                Configure the model endpoint in the Setup tab before generating routines.
              </div>
            </div>
          </div>
        )}

        {/* ── Domain Step ─────────────────────────────────────────────────── */}
        {step === 'domain' && (
          <div className="animate-fade-in">
            <h3 className="text-[14px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 font-mono mb-1">
              Describe your routines
            </h3>
            <p className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mb-4">
              Describe what functions and procedures you need. The model will design them based on your existing table schemas.
            </p>

            {/* Show existing table context + suggested routines */}
            {tableSchemas.length > 0 && (() => {
              const suggestions: string[] = []
              for (const t of tableSchemas) {
                const pk = t.columns.find(c => c.name.endsWith('_id') || c.name === 'id')
                const statusCol = t.columns.find(c => ['status', 'state', 'is_available'].includes(c.name))
                suggestions.push(`look up ${t.name} by ${pk?.name || 'id'}`)
                if (statusCol) suggestions.push(`update ${t.name} ${statusCol.name}`)
              }
              return (
                <>
                  <div className="mb-3 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-2">suggested routines (click to add)</div>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map(s => (
                        <button
                          key={s}
                          onClick={() => setDomain(prev => prev ? `${prev.trimEnd()}, ${s}` : s)}
                          className="text-[10px] font-mono px-2 py-1 rounded-md border border-dbx-gray-200 dark:border-dbx-gray-700 text-dbx-gray-500 dark:text-dbx-gray-400 hover:border-dbx-blue dark:hover:border-dbx-green hover:text-dbx-blue dark:hover:text-dbx-green transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-2">available tables (from data gen)</div>
                    {tableSchemas.map(t => (
                      <div key={t.name} className="flex items-center gap-2 py-0.5">
                        <span className="text-dbx-blue dark:text-dbx-green font-mono text-[11px]">{t.name}</span>
                        <span className="text-[10px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500">
                          ({t.columns.map(c => c.name).join(', ')})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )
            })()}

            <textarea
              value={domain}
              onChange={e => setDomain(e.target.value)}
              rows={4}
              disabled={triggerMode === 'schema' || !modelReady}
              placeholder={tableSchemas.length > 0
                ? `e.g. I need functions to query ${tableSchemas[0]?.name || 'data'} and procedures to update records...`
                : 'Describe what functions and procedures you need...'}
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
                disabled={!domain.trim() || !modelReady}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-mono font-medium bg-dbx-red text-white hover:bg-[#E02E1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                generate routine schemas
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
                  Review routine definitions
                </h3>
                <p className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mt-0.5">
                  Edit names, types, parameters, and instructions. Add or remove routines.
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
              {routines.map((routine, i) => (
                <FuncGenSchemaCard
                  key={i}
                  routine={routine}
                  index={i}
                  onChange={updated => updateRoutine(i, updated)}
                  onRemove={() => removeRoutine(i)}
                />
              ))}
            </div>

            <button
              onClick={addRoutine}
              className="mt-4 flex items-center gap-1.5 text-[12px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-blue dark:hover:text-dbx-green transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> add routine
            </button>

            <div className="mt-6">
              <button
                onClick={startSqlGeneration}
                disabled={routines.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-mono font-medium bg-dbx-red text-white hover:bg-[#E02E1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                generate SQL
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── SQL Step ────────────────────────────────────────────────────── */}
        {step === 'sql' && currentRoutine && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 font-mono">
                  Review generated SQL
                </h3>
                <p className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mt-0.5">
                  Routine {currentIdx + 1} of {routines.length}: <span className="text-dbx-gray-600 dark:text-dbx-gray-300">{currentRoutine.name}</span>
                  <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${
                    currentRoutine.type === 'procedure'
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-500'
                      : 'bg-dbx-blue-bg dark:bg-dbx-green-bg/10 text-dbx-blue dark:text-dbx-green'
                  }`}>
                    {currentRoutine.type}
                  </span>
                </p>
              </div>
              <button
                onClick={() => { setStep('schema'); setTriggerMode(null) }}
                className="flex items-center gap-1 text-[12px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> back to schema
              </button>
            </div>

            {/* Routine checklist */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-5 font-mono text-[11px]">
              {routines.map((r, i) => {
                const done = i < currentIdx
                const active = i === currentIdx
                return (
                  <div key={r.name} className="flex items-center gap-1.5">
                    <span className={done ? 'text-emerald-400' : active ? 'text-dbx-amber' : 'text-dbx-gray-600'}>{done ? '[+]' : '[ ]'}</span>
                    <span className={done ? 'text-emerald-400' : active ? 'text-dbx-gray-200' : 'text-dbx-gray-600'}>{r.name}</span>
                  </div>
                )
              })}
            </div>

            {/* Terminal (when generating or saving) */}
            {(triggerMode === 'sql' || triggerMode === 'save') && (
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

            {/* SQL Preview (when ready and not running) */}
            {currentSql && !isRunning && (
              <div className="animate-fade-in">
                <div className="rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-dbx-gray-950 overflow-hidden">
                  <pre className="p-4 text-[12px] font-mono text-dbx-gray-300 leading-relaxed overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                    {currentSql}
                  </pre>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleApproveSql}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-mono font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    approve & save
                  </button>
                  <button
                    onClick={() => handleRegenerateSql()}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400 border border-dbx-gray-200 dark:border-dbx-gray-700 hover:border-dbx-gray-400 dark:hover:border-dbx-gray-500 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    regenerate
                  </button>
                </div>
              </div>
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
              All {routines.length} routine(s) saved locally. Procedures will be created in UC. Function templates are saved locally for agent use.
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
            </div>

            {/* Routines ready */}
            <div className="mb-4 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 px-4 py-3">
              <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-2">routines ready</div>
              {routines.map(r => (
                <div key={r.name} className="flex items-center gap-2 py-1">
                  <span className="text-emerald-500 font-mono text-[12px]">[+]</span>
                  <span className="text-[12px] font-mono text-dbx-gray-600 dark:text-dbx-gray-300">{r.name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    r.type === 'procedure'
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-500'
                      : 'bg-dbx-gray-50 dark:bg-dbx-gray-800 text-dbx-gray-400 dark:text-dbx-gray-500'
                  }`}>
                    {r.type}
                  </span>
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
                  provision procedures
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
            <div className="text-emerald-500 font-mono text-[14px] font-medium mb-2">[+] All routines provisioned</div>
            <p className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mb-6">
              {routines.filter(r => r.type === 'procedure').length} procedure(s) created in UC, {routines.filter(r => r.type === 'function').length} function template(s) saved locally
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
