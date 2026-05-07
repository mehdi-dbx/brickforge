import { Globe, KeyRound, Database, LayoutGrid, Table2, FunctionSquare, Sparkles, MessageSquareText, Wand2, BookOpen, FlaskConical, ShieldCheck, Rocket, type LucideIcon } from 'lucide-react'
import type { StepId, StepStatus, StepState } from '../types'
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
  mlflow:    FlaskConical,
  grants:    ShieldCheck,
  deploy:    Rocket,
}

interface SetupDagProps {
  stepStates: Record<StepId, StepState>
  activeStep: StepId
  onActivate: (id: StepId) => void
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
  const v = state.values
  if (state.status === 'missing') return 'not configured'
  switch (id) {
    case 'host':      return v.DATABRICKS_HOST?.replace('https://', '') || 'set'
    case 'auth':      return v.DATABRICKS_TOKEN ? v.DATABRICKS_TOKEN.slice(0, 4) + '*'.repeat(Math.max(0, v.DATABRICKS_TOKEN.length - 4)) : 'not set'
    case 'warehouse': return v.DATABRICKS_WAREHOUSE_ID || 'set'
    case 'schema':    return v.PROJECT_UNITY_CATALOG_SCHEMA || 'set'
    case 'model':     return v.AGENT_MODEL_ENDPOINT?.replace('https://', '') || 'not set'
    case 'prompt':    return v.PROMPT_FILES || 'conf/prompt/'
    case 'genie':     return v.PROJECT_GENIE_CHECKIN || 'set'
    case 'ka':        return v.PROJECT_KA_PASSENGERS || 'set'
    case 'mlflow':    return v.MLFLOW_EXPERIMENT_ID || 'set'
    case 'grants':    return 'run to apply'
    case 'deploy':    return v.DBX_APP_NAME || 'not configured'
    default:          return 'set'
  }
}

const ALL_STEPS: StepId[] = SETUP_STEPS.map(s => s.id)

export function SetupDag({ stepStates, activeStep, onActivate, readyCount, totalCount }: SetupDagProps) {
  return (
    <div className="flex flex-col h-full px-4 py-2">
      {/* Top pill */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <span className="text-[11px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400 bg-white dark:bg-dbx-gray-800 border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-full px-3 py-1 shadow-node">
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
          return (
            <div key={id} className="flex flex-col items-center" style={{ flex: idx < ALL_STEPS.length - 1 ? '1 1 0' : '0 0 auto' }}>
              <button
                onClick={() => onActivate(id)}
                className={`
                  w-[280px] flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-all duration-150 flex-shrink-0
                  font-mono
                  ${active
                    ? 'border-2 border-dbx-red bg-dbx-red-bg dark:bg-dbx-red-bg-dk dark:border-[#FF6B5A] shadow-dbx-md'
                    : `border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900
                       hover:border-dbx-red-lt dark:hover:border-dbx-gray-600 hover:shadow-node-hover
                       ${state.status === 'done' ? 'border-l-2 border-l-dbx-blue dark:border-l-dbx-green' : ''}`}
                `}
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${ORB_CLASS[state.status]}`} />
                {(() => { const Icon = STEP_ICON[id]; return <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-dbx-red dark:text-[#FF6B5A]' : state.status === 'done' ? 'text-dbx-blue dark:text-dbx-green' : 'text-dbx-gray-400 dark:text-dbx-gray-500'}`} /> })()}
                <div className="min-w-0">
                  <div className={`text-[18px] font-medium leading-tight truncate transition-colors ${active ? 'text-dbx-red dark:text-[#FF6B5A]' : 'text-dbx-gray-900 dark:text-dbx-gray-100'}`}>
                    {STEP_LABEL[id]}
                  </div>
                  <div className={`text-[10px] leading-tight truncate transition-colors ${state.status === 'done' ? 'text-dbx-blue dark:text-dbx-green' : 'text-dbx-gray-400 dark:text-dbx-gray-500'}`}>
                    {subLabel(id, state)}
                  </div>
                </div>
              </button>

              {/* Connector — flex-1 fills gap between nodes */}
              {idx < ALL_STEPS.length - 1 && (
                <div className="flex justify-center flex-1 min-h-[4px]">
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
