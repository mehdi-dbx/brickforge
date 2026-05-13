import { Globe, KeyRound, Database, LayoutGrid, Table2, FunctionSquare, Sparkles, MessageSquareText, Wand2, BookOpen, Search, FlaskConical, ShieldCheck, Rocket, Power, Plus, type LucideIcon } from 'lucide-react'
import type { StepId, StepStatus, StepState, StepInstance } from '../types'
import { SETUP_STEPS } from '../setupSteps'

const STEP_LABEL: Record<StepId, string> = Object.fromEntries(SETUP_STEPS.map(s => [s.id, s.label])) as Record<StepId, string>

const STEP_ICON: Record<StepId, LucideIcon> = {
  host:      Globe,
  auth:      KeyRound,
  warehouse: Database,
  schema:    LayoutGrid,
  tables:    Table2,
  functions: FunctionSquare,
  model:     Sparkles,
  prompt:    MessageSquareText,
  genie:     Wand2,
  ka:        BookOpen,
  vs:        Search,
  mlflow:    FlaskConical,
  grants:    ShieldCheck,
  deploy:    Rocket,
}

const MULTI_INSTANCE_STEPS: StepId[] = ['genie', 'ka', 'vs']

interface SetupDagProps {
  stepStates: Record<StepId, StepState>
  activeStep: StepId
  onActivate: (id: StepId) => void
  onToggleInstance?: (key: string) => void
  onToggleAllInstances?: (stepId: StepId) => void
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
    case 'auth':      return v.DATABRICKS_TOKEN ? v.DATABRICKS_TOKEN.slice(0, 4) + '*'.repeat(Math.max(0, v.DATABRICKS_TOKEN.length - 4)) : 'not set'
    case 'warehouse': return v.DATABRICKS_WAREHOUSE_ID || 'set'
    case 'schema':    return v.PROJECT_UNITY_CATALOG_SCHEMA || 'set'
    case 'model':     return v.AGENT_MODEL_ENDPOINT?.replace('https://', '') || 'not set'
    case 'prompt':    return v.PROMPT_FILES || 'conf/prompt/'
    case 'genie':     return v.PROJECT_GENIE_CHECKIN || 'not configured'
    case 'ka':        return v.PROJECT_KA_PASSENGERS || 'not configured'
    case 'vs':        return v.PROJECT_VS_INDEX || 'not configured'
    case 'mlflow':    return v.MLFLOW_EXPERIMENT_ID || 'set'
    case 'grants':    return 'run to apply'
    case 'deploy':    return v.DBX_APP_NAME || 'not configured'
    default:          return 'set'
  }
}

const ALL_STEPS: StepId[] = SETUP_STEPS.map(s => s.id)

// Border color for multi-instance step types
const INSTANCE_BORDER: Record<string, string> = {
  genie: 'border-dbx-amber',
  ka:    'border-dbx-blue dark:border-dbx-blue',
  vs:    'border-purple-400 dark:border-purple-500',
}

function InstanceRow({ inst, stepId, onToggle }: { inst: StepInstance; stepId: StepId; onToggle?: (key: string) => void }) {
  const borderColor = INSTANCE_BORDER[stepId] || 'border-dbx-gray-300'
  return (
    <div className={`
      relative flex items-center gap-1.5 w-full px-2.5 py-[0.3vh] rounded-md text-left font-mono
      border ${borderColor} ${inst.enabled ? 'bg-white/60 dark:bg-dbx-gray-800/60' : 'bg-dbx-gray-100/50 dark:bg-dbx-gray-900/50 opacity-50'}
      transition-all duration-150
    `}>
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inst.enabled ? 'bg-dbx-blue dark:bg-dbx-green' : 'bg-dbx-gray-300 dark:bg-dbx-gray-600'}`} />
      <div className="min-w-0 flex-1">
        <div className={`text-[clamp(9px,1.2vh,12px)] font-medium leading-tight truncate ${inst.enabled ? 'text-dbx-gray-700 dark:text-dbx-gray-200' : 'text-dbx-gray-400 dark:text-dbx-gray-600 line-through'}`}>
          {inst.label}
        </div>
        <div className="text-[clamp(7px,0.8vh,9px)] leading-tight truncate text-dbx-gray-400 dark:text-dbx-gray-500 font-mono">
          {inst.value.length > 20 ? inst.value.slice(0, 20) + '...' : inst.value}
        </div>
      </div>
      {/* Toggle button — top right, same outline color */}
      {onToggle && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(inst.key) }}
          className={`
            flex-shrink-0 p-0.5 rounded transition-all duration-150
            ${inst.enabled
              ? `text-dbx-gray-300 dark:text-dbx-gray-500 hover:text-dbx-red dark:hover:text-[#FF6B5A]`
              : `text-dbx-gray-300 dark:text-dbx-gray-600 hover:text-dbx-green dark:hover:text-dbx-green`}
          `}
          title={inst.enabled ? 'Disable' : 'Enable'}
        >
          <Power className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export function SetupDag({ stepStates, activeStep, onActivate, onToggleInstance, onToggleAllInstances, readyCount, totalCount }: SetupDagProps) {
  return (
    <div className="flex flex-col h-full px-4 py-[0.5vh]">
      {/* Top pill */}
      <div className="flex items-center justify-between mb-[0.5vh] flex-shrink-0">
        <span className="text-[11px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400 bg-white dark:bg-dbx-gray-800 border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-full px-3 py-0.5 shadow-node">
          .env.local
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-dbx-red">{readyCount}</span>
          <span className="text-[11px] text-dbx-gray-300 dark:text-dbx-gray-600">/</span>
          <span className="text-[11px] text-dbx-gray-400 dark:text-dbx-gray-500">{totalCount}</span>
        </div>
      </div>

      {/* Nodes — single column, flex-grow connectors fill height */}
      <div className="flex flex-col flex-1 min-h-0">
        {ALL_STEPS.map((id, idx) => {
          const state  = stepStates[id]
          const active = activeStep === id
          const isMulti = MULTI_INSTANCE_STEPS.includes(id)
          const instances = state.instances || []

          return (
            <div key={id} className="flex flex-col items-center" style={{ flex: idx < ALL_STEPS.length - 1 ? '1 1 0' : '0 0 auto', marginBottom: idx === ALL_STEPS.length - 1 ? '2vh' : undefined }}>
              <div className="w-[280px] flex flex-col flex-shrink-0">
                {/* Main step button */}
                <button
                  onClick={() => onActivate(id)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-[0.4vh] rounded-lg text-left transition-all duration-150
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
                    <div className={`text-[clamp(11px,1.6vh,18px)] font-medium leading-tight truncate transition-colors ${active ? 'text-dbx-red dark:text-[#FF6B5A]' : 'text-dbx-gray-900 dark:text-dbx-gray-100'}`}>
                      {STEP_LABEL[id]}
                    </div>
                    <div className={`text-[clamp(8px,1vh,10px)] leading-tight truncate transition-colors ${state.status === 'done' ? 'text-dbx-blue dark:text-dbx-green' : 'text-dbx-gray-400 dark:text-dbx-gray-500'}`}>
                      {subLabel(id, state)}
                    </div>
                  </div>
                  {/* Toggle all + "+" buttons for multi-instance steps */}
                  {isMulti && instances.length > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleAllInstances?.(id) }}
                      className={`flex-shrink-0 p-0.5 rounded transition-colors ${
                        instances.some(i => i.enabled)
                          ? 'text-dbx-gray-300 dark:text-dbx-gray-500 hover:text-dbx-red dark:hover:text-[#FF6B5A]'
                          : 'text-dbx-gray-300 dark:text-dbx-gray-600 hover:text-dbx-green dark:hover:text-dbx-green'
                      }`}
                      title={instances.some(i => i.enabled) ? `Disable all ${STEP_LABEL[id]}` : `Enable all ${STEP_LABEL[id]}`}
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

                {/* Sub-instances for multi-instance steps */}
                {isMulti && instances.length > 0 && (
                  <div className="flex flex-col gap-0.5 mt-0.5 ml-6">
                    {instances.map(inst => (
                      <InstanceRow key={inst.key} inst={inst} stepId={id} onToggle={onToggleInstance} />
                    ))}
                  </div>
                )}
              </div>

              {/* Connector — flex-1 fills gap between nodes, min-h ensures visibility */}
              {idx < ALL_STEPS.length - 1 && (
                <div className="flex justify-center flex-1 min-h-[12px]">
                  <div className={`w-px ${
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
  )
}
