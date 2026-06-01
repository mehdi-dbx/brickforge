import { useRef, useState, useEffect, useCallback } from 'react'
import { Globe, Database, LayoutGrid, Table2, FunctionSquare, Sparkles, MessageSquareText, Wand2, Blocks, Search, Plug, Zap, Bot, ToggleRight, FlaskConical, ShieldCheck, Rocket, GitBranch, Power, Plus, Trash2, ZoomIn, ZoomOut, Maximize2, ChevronRight, type LucideIcon } from 'lucide-react'
import type { StepId, StepStatus, StepState, StepInstance } from '../types'
import { SETUP_STEPS } from '../setupSteps'

const STEP_LABEL: Record<StepId, string> = Object.fromEntries(SETUP_STEPS.map(s => [s.id, s.label])) as Record<StepId, string>

const STEP_ICON: Record<StepId, LucideIcon> = {
  host:      Globe,
  warehouse: Database,
  schema:    LayoutGrid,
  tables:    Table2,
  functions: FunctionSquare,
  model:     Sparkles,
  prompt:    MessageSquareText,
  genie:     Wand2,
  bricks:    Blocks,
  vs:        Search,
  mcp:       Plug,
  api:       Zap,
  a2a:       Bot,
  features:  ToggleRight,
  mlflow:    FlaskConical,
  grants:    ShieldCheck,
  deploy:    Rocket,
  git:       GitBranch,
}

const MULTI_INSTANCE_STEPS: StepId[] = ['genie', 'bricks', 'vs', 'mcp', 'api', 'a2a', 'features']

interface SetupDagProps {
  stepStates: Record<StepId, StepState>
  activeStep: StepId
  onActivate: (id: StepId) => void
  onToggleInstance?: (key: string) => void
  onToggleAllInstances?: (stepId: StepId) => void
  onClickInstance?: (stepId: StepId, key: string) => void
  onDeleteInstance?: (key: string) => void
  readyCount: number
  totalCount: number
}

const ORB_CLASS: Record<StepStatus, string> = {
  done:    'bg-dbx-blue dark:bg-dbx-green shadow-[0_0_6px_rgba(46,125,209,0.4)] dark:shadow-[0_0_6px_rgba(0,169,114,0.4)]',
  warning: 'bg-dbx-amber animate-pulse shadow-[0_0_6px_rgba(230,138,0,0.4)]',
  error:   'bg-dbx-error shadow-[0_0_6px_rgba(226,75,74,0.4)]',
  missing: 'bg-dbx-gray-300 dark:bg-dbx-gray-600',
  unknown: 'bg-dbx-gray-300 dark:bg-dbx-gray-600',
}

function subLabel(id: StepId, state: StepState): string {
  // For multi-instance steps, show count
  if (MULTI_INSTANCE_STEPS.includes(id) && state.instances?.length) {
    const enabled = state.instances.filter(i => i.enabled).length
    const total = state.instances.length
    return enabled === total ? `${total} configured` : `${enabled}/${total} enabled`
  }
  const v = state.values
  if (state.status === 'missing') return 'not configured'
  switch (id) {
    case 'host':      return v.DATABRICKS_HOST?.replace('https://', '') || 'set'
    case 'warehouse': return v.DATABRICKS_WAREHOUSE_ID || 'set'
    case 'schema':    return v.PROJECT_UNITY_CATALOG_SCHEMA || 'set'
    case 'model':     return v.AGENT_MODEL_ENDPOINT?.replace('https://', '') || 'not set'
    case 'prompt':    return v.PROMPT_FILES || 'conf/prompt/'
    case 'genie':     return 'not configured'
    case 'bricks':    return 'not configured'
    case 'vs':        return v.PROJECT_VS_INDEX || 'not configured'
    case 'mcp':       return 'not configured'
    case 'api':       return 'not configured'
    case 'a2a':       return 'not configured'
    case 'features':  return 'not configured'
    case 'mlflow':    return v.MLFLOW_EXPERIMENT_ID || 'set'
    case 'grants':    return 'run to apply'
    case 'deploy':    return v.DBX_APP_NAME || 'not configured'
    case 'git':       return 'not configured'
    default:          return 'set'
  }
}

const ALL_STEPS: StepId[] = SETUP_STEPS.map(s => s.id)

// Border color for multi-instance step types
const INSTANCE_BORDER: Record<string, string> = {
  genie: 'border-dbx-amber',
  bricks: 'border-dbx-blue dark:border-dbx-blue',
  vs:    'border-purple-400 dark:border-purple-500',
  mcp:   'border-emerald-400 dark:border-emerald-500',
  api:   'border-orange-400 dark:border-orange-500',
  features: 'border-cyan-400 dark:border-cyan-500',
  a2a:   'border-cyan-400 dark:border-cyan-500',
}

/* ── Confirm dialog (replaces window.confirm) ────────── */
function ConfirmDialog({ title, detail, onConfirm, onCancel }: { title: string; detail: string; onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); if (e.key === 'Enter') onConfirm() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onConfirm, onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onCancel}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]" />
      {/* Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[340px] bg-white dark:bg-dbx-gray-900 border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-xl shadow-2xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-dbx-error/10 dark:bg-dbx-error/20 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5 text-dbx-error" />
            </div>
            <h3 className="text-[14px] font-semibold text-dbx-gray-900 dark:text-dbx-gray-100 font-mono">{title}</h3>
          </div>
          <p className="text-[12px] text-dbx-gray-500 dark:text-dbx-gray-400 leading-relaxed ml-9">{detail}</p>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-dbx-gray-100 dark:border-dbx-gray-800">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 text-[12px] font-medium font-mono rounded-lg
              text-dbx-gray-600 dark:text-dbx-gray-400
              border border-dbx-gray-200 dark:border-dbx-gray-700
              hover:bg-dbx-gray-50 dark:hover:bg-dbx-gray-800 transition-colors"
          >
            cancel
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className="px-3.5 py-1.5 text-[12px] font-medium font-mono rounded-lg
              text-white bg-dbx-error hover:bg-dbx-error/90
              shadow-sm hover:shadow transition-all"
          >
            remove
          </button>
        </div>
      </div>
    </div>
  )
}

function InstanceRow({ inst, stepId, onToggle, onClick, onDelete }: { inst: StepInstance; stepId: StepId; onToggle?: (key: string) => void; onClick?: (key: string) => void; onDelete?: (key: string) => void }) {
  const borderColor = INSTANCE_BORDER[stepId] || 'border-dbx-gray-300'
  const [confirmOpen, setConfirmOpen] = useState(false)
  return (
    <>
      <div
        onClick={() => onClick?.(inst.key)}
        className={`
        relative flex items-center gap-1.5 w-full px-2.5 py-[3px] rounded-md text-left font-mono cursor-pointer
        border ${borderColor} ${inst.enabled ? 'bg-white/60 dark:bg-dbx-gray-800/60 hover:bg-white/80 dark:hover:bg-dbx-gray-800/80' : 'bg-dbx-gray-100/50 dark:bg-dbx-gray-900/50'}
        transition-all duration-150
      `}>
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inst.enabled ? 'bg-dbx-blue dark:bg-dbx-green' : 'bg-dbx-gray-300 dark:bg-dbx-gray-600'}`} />
        <div className="min-w-0 flex-1">
          <div className={`text-[11px] font-medium leading-tight truncate ${inst.enabled ? 'text-dbx-gray-700 dark:text-dbx-gray-200' : 'text-dbx-gray-400 dark:text-dbx-gray-500'}`}>
            {inst.label}
          </div>
          <div className="text-[8px] leading-tight truncate text-dbx-gray-400 dark:text-dbx-gray-500 font-mono">
            {inst.value.length > 20 ? inst.value.slice(0, 20) + '...' : inst.value}
          </div>
        </div>
        {/* Toggle button */}
        {onToggle && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(inst.key) }}
            className={`
              flex-shrink-0 p-0.5 rounded transition-all duration-150
              ${inst.enabled
                ? `text-dbx-green hover:text-dbx-red dark:hover:text-[#FF6B5A]`
                : `text-dbx-gray-300 dark:text-dbx-gray-600 hover:text-dbx-green dark:hover:text-dbx-green`}
            `}
            title={inst.enabled ? 'Disable' : 'Enable'}
          >
            <Power className="w-3 h-3" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmOpen(true) }}
            className="flex-shrink-0 p-0.5 rounded text-dbx-gray-200 dark:text-dbx-gray-700 hover:text-dbx-error transition-all duration-150"
            title="Remove"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      {/* Nested children (e.g. KA instances under KA brick) */}
      {inst.children && inst.children.length > 0 && (
        <div className="flex flex-col gap-0.5 ml-3 mt-0.5">
          {inst.children.map(child => (
            <InstanceRow key={child.key} inst={child} stepId={stepId} onToggle={onToggle} onClick={onClick} onDelete={onDelete} />
          ))}
        </div>
      )}
      {confirmOpen && (
        <ConfirmDialog
          title={`Remove ${inst.label}?`}
          detail={`This will delete ${inst.key} from .env.local.`}
          onConfirm={() => { setConfirmOpen(false); onDelete?.(inst.key) }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  )
}

export function SetupDag({ stepStates, activeStep, onActivate, onToggleInstance, onToggleAllInstances, onClickInstance, onDeleteInstance, readyCount, totalCount }: SetupDagProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  const [collapsed, setCollapsed] = useState<Set<StepId>>(new Set())

  /* ── fit-to-view ───────────────────────────────────── */
  const fitToView = useCallback(() => {
    const scroller = scrollRef.current
    const content = contentRef.current
    if (!scroller || !content) return

    // Measure natural height at zoom=1 (synchronous, no paint flash)
    const prev = content.style.zoom
    content.style.zoom = '1'
    const naturalH = content.scrollHeight
    content.style.zoom = prev

    if (naturalH <= 0) return
    const scale = Math.min(scroller.clientHeight / naturalH, 1)
    const next = Math.max(0.2, Math.round(scale * 100) / 100)
    zoomRef.current = next
    setZoom(next)
  }, [])

  // Fit on mount + container resize
  useEffect(() => {
    fitToView()
    const el = scrollRef.current
    if (!el) return
    const obs = new ResizeObserver(fitToView)
    obs.observe(el)
    return () => obs.disconnect()
  }, [fitToView])

  // Ctrl/Cmd + wheel zoom
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const next = zoomRef.current - e.deltaY * 0.002
        const clamped = Math.min(1.5, Math.max(0.2, Math.round(next * 100) / 100))
        zoomRef.current = clamped
        setZoom(clamped)
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  return (
    <div className="relative h-full">
      {/* ── Floating toolbar: env pill + counter + zoom controls ── */}
      <div className="absolute top-1.5 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="text-[11px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400 bg-white/90 dark:bg-dbx-gray-800/90 backdrop-blur-sm border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-full px-3 py-0.5 shadow-node">
            .env.local
          </span>
          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-dbx-gray-800/90 backdrop-blur-sm border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-full px-2.5 py-0.5 shadow-node">
            <span className="text-[11px] font-semibold text-dbx-red">{readyCount}</span>
            <span className="text-[11px] text-dbx-gray-300 dark:text-dbx-gray-600">/</span>
            <span className="text-[11px] text-dbx-gray-400 dark:text-dbx-gray-500">{totalCount}</span>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5 text-dbx-gray-400 dark:text-dbx-gray-500 bg-white/90 dark:bg-dbx-gray-800/90 backdrop-blur-sm border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-full px-1.5 py-0.5 shadow-node pointer-events-auto">
          <button
            onClick={() => { const n = Math.min(1.5, +(zoomRef.current + 0.1).toFixed(1)); zoomRef.current = n; setZoom(n) }}
            className="p-1 rounded-full hover:bg-dbx-gray-100 dark:hover:bg-dbx-gray-800 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono w-8 text-center select-none">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => { const n = Math.max(0.2, +(zoomRef.current - 0.1).toFixed(1)); zoomRef.current = n; setZoom(n) }}
            className="p-1 rounded-full hover:bg-dbx-gray-100 dark:hover:bg-dbx-gray-800 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-dbx-gray-200 dark:bg-dbx-gray-700 mx-0.5" />
          <button
            onClick={fitToView}
            className="p-1 rounded-full hover:bg-dbx-gray-100 dark:hover:bg-dbx-gray-800 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 transition-colors"
            title="Fit to view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Scrollable + zoomable DAG area (full height) ── */}
      <div ref={scrollRef} className="h-full overflow-auto">
        <div
          ref={contentRef}
          className="flex flex-col items-center px-4 pt-8 pb-6"
          style={{ zoom } as React.CSSProperties}
        >
          {ALL_STEPS.map((id, idx) => {
            const state  = stepStates[id]
            const active = activeStep === id
            const isMulti = MULTI_INSTANCE_STEPS.includes(id)
            const instances = state.instances || []

            return (
              <div key={id} className="flex flex-col items-center">
                <div className="w-[280px] flex flex-col flex-shrink-0">
                  {/* Main step button */}
                  <button
                    onClick={() => onActivate(id)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-1 rounded-lg text-left transition-all duration-150
                      font-mono
                      ${active
                        ? 'border-2 border-dbx-red bg-dbx-red-bg dark:bg-dbx-red-bg-dk dark:border-[#FF6B5A] shadow-dbx-md'
                        : `border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900
                           hover:border-dbx-red-lt dark:hover:border-dbx-gray-600 hover:shadow-node-hover
                           ${state.status === 'done' ? 'border-l-2 border-l-dbx-blue dark:border-l-dbx-green' : ''}`}
                    `}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${ORB_CLASS[state.status]}`} />
                    {(() => { const Icon = STEP_ICON[id]; return <Icon className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${active ? 'text-dbx-red dark:text-[#FF6B5A]' : state.status === 'done' ? 'text-dbx-blue dark:text-dbx-green' : 'text-dbx-gray-400 dark:text-dbx-gray-500'}`} /> })()}
                    <div className="min-w-0 flex-1">
                      <div className={`text-[13px] font-medium leading-tight truncate transition-colors ${active ? 'text-dbx-red dark:text-[#FF6B5A]' : 'text-dbx-gray-900 dark:text-dbx-gray-100'}`}>
                        {STEP_LABEL[id]}
                      </div>
                      <div className={`text-[10px] leading-tight truncate transition-colors ${state.status === 'done' ? 'text-dbx-blue dark:text-dbx-green' : 'text-dbx-gray-400 dark:text-dbx-gray-500'}`}>
                        {subLabel(id, state)}
                      </div>
                    </div>
                    {/* Toggle all + "+" buttons for multi-instance steps */}
                    {isMulti && (
                      <button
                        onClick={(e) => { e.stopPropagation(); if (instances.length > 0) onToggleAllInstances?.(id) }}
                        disabled={instances.length === 0}
                        className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                          instances.length === 0
                            ? 'text-dbx-gray-200 dark:text-dbx-gray-700 cursor-default'
                            : instances.some(i => i.enabled)
                              ? 'text-dbx-green hover:text-dbx-red dark:hover:text-[#FF6B5A]'
                              : 'text-dbx-gray-300 dark:text-dbx-gray-600 hover:text-dbx-green dark:hover:text-dbx-green'
                        }`}
                        title={instances.length === 0 ? `No ${STEP_LABEL[id]} configured` : instances.some(i => i.enabled) ? `Disable all ${STEP_LABEL[id]}` : `Enable all ${STEP_LABEL[id]}`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isMulti && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onActivate(id) }}
                        className="flex-shrink-0 p-0.5 rounded text-dbx-gray-300 dark:text-dbx-gray-600 hover:text-dbx-blue dark:hover:text-dbx-green transition-colors"
                        title={`Add ${STEP_LABEL[id]}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </button>

                  {/* Sub-instances for multi-instance steps (collapsible) */}
                  {isMulti && instances.length > 0 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCollapsed(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next }) }}
                        className="flex items-center gap-1 ml-6 mt-0.5 mb-0.5 text-[10px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 transition-colors"
                      >
                        <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${collapsed.has(id) ? '' : 'rotate-90'}`} />
                        {collapsed.has(id) ? `${instances.length} hidden` : 'collapse'}
                      </button>
                      <div
                        className="grid ml-6 transition-[grid-template-rows] duration-200 ease-in-out"
                        style={{ gridTemplateRows: collapsed.has(id) ? '0fr' : '1fr' }}
                      >
                        <div className="overflow-hidden">
                          <div className="flex flex-col gap-0.5">
                            {instances.map(inst => (
                              <InstanceRow key={inst.key} inst={inst} stepId={id} onToggle={onToggleInstance} onClick={(k) => onClickInstance?.(id, k)} onDelete={onDeleteInstance} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Fixed-height connector line */}
                {idx < ALL_STEPS.length - 1 && (
                  <div className="flex justify-center h-3">
                    <div className={`w-px h-full ${
                      stepStates[ALL_STEPS[idx]].status === 'done' && stepStates[ALL_STEPS[idx + 1]].status === 'done'
                        ? 'bg-dbx-blue/30 dark:bg-dbx-green/30'
                        : 'bg-dbx-gray-200 dark:bg-dbx-gray-800'
                    }`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Minimap -- fixed bottom-right, vertical strip of status dots */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 bg-white/90 dark:bg-dbx-gray-800/90 backdrop-blur-sm border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-full px-1.5 py-2 shadow-node">
        {ALL_STEPS.map(id => {
          const s = stepStates[id]
          const isActive = activeStep === id
          return (
            <button
              key={id}
              onClick={() => onActivate(id)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${ORB_CLASS[s.status]} ${isActive ? 'ring-2 ring-dbx-red ring-offset-1 dark:ring-offset-dbx-gray-800 scale-125' : 'hover:scale-125'}`}
              title={STEP_LABEL[id]}
            />
          )
        })}
      </div>
    </div>
  )
}
