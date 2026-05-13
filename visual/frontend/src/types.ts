export type NodeKind = 'agent' | 'llm' | 'tool' | 'genie' | 'data'
export type DataVariant = 'table' | 'function' | 'procedure'

export interface ArchNodeData extends Record<string, unknown> {
  kind: NodeKind
  label: string
  subtitle?: string
  sourceFile?: string
  meta?: Record<string, string>
  dataVariant?: DataVariant
}

export interface ArchNode {
  id: string
  type: NodeKind
  position: { x: number; y: number }
  data: ArchNodeData
}

export interface ArchEdge {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
}

export interface GraphResponse {
  nodes: ArchNode[]
  edges: ArchEdge[]
  meta: {
    projectRoot: string
    generatedAt: string
  }
}

// ─── Setup types ──────────────────────────────────────────────────────────────

export type StepId = 'host' | 'auth' | 'warehouse' | 'schema' | 'tables' | 'functions' | 'model' | 'prompt' | 'genie' | 'ka' | 'vs' | 'mlflow' | 'grants' | 'deploy'
export type StepStatus = 'done' | 'warning' | 'error' | 'missing' | 'unknown'
export type SetupPhase = 'choose' | 'configure' | 'execute' | 'done'

export interface StepChoice {
  title: string
  desc: string
  action: string
}

export interface SetupStep {
  id: StepId
  label: string
  title: string
  help: string
  choices: StepChoice[]
}

export interface DbxProfile {
  name: string
  host: string
  valid: boolean
}

export interface DbxWarehouse {
  id: string
  name: string
  state: string
}

export interface DbxGenieSpace {
  id: string
  name: string
}

export interface ExecLine {
  text: string
  stream: 'out' | 'err'
}

export interface StepInstance {
  key: string        // e.g. PROJECT_GENIE_CHECKIN
  value: string      // e.g. space_id or endpoint name
  enabled: boolean   // true = active, false = commented out
  label: string      // derived slug: "checkin", "passengers"
}

export interface StepState {
  status: StepStatus
  values: Record<string, string>
  instances?: StepInstance[]  // for multi-instance steps (genie, ka)
}

// ─── Data generation types ───────────────────────────────────────────────────

export interface TableColumn {
  name: string
  type: string
}

export interface TableDef {
  name: string
  columns: TableColumn[]
  row_count: number
  instructions: string
}

export interface GenStatus {
  modelReady: boolean
  manifest: { generated_at: string; tables: TableDef[] } | null
}

export type GenStep = 'domain' | 'schema' | 'data' | 'provision' | 'done'
export type DataMode = 'tables' | 'generate' | 'generate-routines'

// ─── Routine generation types ───────────────────────────────────────────────

export interface RoutineParam {
  name: string
  sql_type: string
}

export interface RoutineDef {
  name: string
  type: 'function' | 'procedure'
  description: string
  parameters: RoutineParam[]
  tables_referenced: string[]
  instructions: string
  sql?: string
}

export type FuncGenStep = 'domain' | 'schema' | 'sql' | 'provision' | 'done'
