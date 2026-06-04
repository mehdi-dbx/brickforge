'use strict'

const fs   = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const PROJECT_ROOT = path.resolve(__dirname, '../../..')
const APP_YAML     = path.join(PROJECT_ROOT, 'app.yaml')

function readAppYaml() {
  try {
    return yaml.load(fs.readFileSync(APP_YAML, 'utf8')) || {}
  } catch {
    return {}
  }
}

function extractEnvVars(appYaml) {
  const vars = {}
  for (const e of (appYaml.env || [])) {
    vars[e.name] = e.value || (e.valueFrom ? `<secret:${e.valueFrom}>` : '')
  }
  return vars
}

function parseModelName(endpoint) {
  const m = (endpoint || '').match(/serving-endpoints\/([^/]+)\/invocations/)
  return m ? m[1] : (endpoint || 'unknown')
}

/** Scan a directory for files with a given extension, return basenames without extension */
function scanDir(dir, ext) {
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith(ext)).map(f => f.replace(ext, ''))
  } catch { return [] }
}

function buildGraph() {
  const appYaml  = readAppYaml()
  const envVars  = extractEnvVars(appYaml)
  const endpoint = envVars['AGENT_MODEL'] || ''
  const modelName = parseModelName(endpoint)
  const schema   = envVars['PROJECT_UNITY_CATALOG_SCHEMA'] || ''
  const [catalog, schemaName] = schema ? schema.split('.') : ['', '']

  // Auto-discover tools, functions, procedures, tables from filesystem
  const FRAMEWORK_TOOLS = new Set(['sql_executor', 'ka_factory', 'get_current_time', '__init__'])
  const tools = scanDir(path.join(PROJECT_ROOT, 'tools'), '.py').filter(t => !FRAMEWORK_TOOLS.has(t))
  const funcs = scanDir(path.join(PROJECT_ROOT, 'data', 'default', 'func'), '.sql')
  const procs = scanDir(path.join(PROJECT_ROOT, 'data', 'default', 'proc'), '.sql')
  const tables = scanDir(path.join(PROJECT_ROOT, 'data', 'default', 'csv'), '.csv')

  const nodes = []
  const edges = []
  let y = 60

  // Agent node (always present)
  nodes.push({
    id: 'agent', type: 'agent', position: { x: 80, y: 300 },
    data: { kind: 'agent', label: 'Agent', subtitle: 'LangGraph ResponsesAgent', sourceFile: 'agent/agent.py',
      meta: { framework: 'LangGraph', server: 'MLflow GenAI', port: '8000' } },
  })

  // LLM node (always present)
  nodes.push({
    id: 'llm', type: 'llm', position: { x: 380, y: y },
    data: { kind: 'llm', label: modelName || '(not set)', subtitle: 'Model endpoint', sourceFile: 'app.yaml',
      meta: { endpoint: endpoint || '(not set)' } },
  })
  edges.push({ id: 'e-agent-llm', source: 'agent', target: 'llm', label: 'uses model' })
  y += 160

  // Genie node (if any PROJECT_GENIE_* env vars exist)
  const genieKeys = Object.keys(envVars).filter(k => k.startsWith('PROJECT_GENIE_'))
  if (genieKeys.length > 0) {
    nodes.push({
      id: 'genie', type: 'genie', position: { x: 380, y: y },
      data: { kind: 'genie', label: `Genie (${genieKeys.length} space${genieKeys.length > 1 ? 's' : ''})`,
        subtitle: 'MCP-based Genie space', sourceFile: 'agent/agent.py',
        meta: { spaces: genieKeys.join(', ') } },
    })
    edges.push({ id: 'e-agent-genie', source: 'agent', target: 'genie', label: 'has MCP tool' })
    y += 160
  }

  // Tool nodes (auto-discovered)
  tools.forEach((tool, i) => {
    const id = `tool-${i}`
    nodes.push({
      id, type: 'tool', position: { x: 380, y: y + i * 80 },
      data: { kind: 'tool', label: tool, subtitle: 'domain tool', sourceFile: `tools/${tool}.py` },
    })
    edges.push({ id: `e-agent-${id}`, source: 'agent', target: id, label: 'has tool' })
  })

  // Data nodes -- functions
  let dataY = 60
  funcs.forEach((fn, i) => {
    const id = `func-${i}`
    nodes.push({
      id, type: 'data', position: { x: 700, y: dataY + i * 80 },
      data: { kind: 'data', label: fn, subtitle: 'UC function', dataVariant: 'function',
        sourceFile: `data/demo/func/${fn}.sql` },
    })
  })

  // Data nodes -- procedures
  const procStart = dataY + funcs.length * 80 + 40
  procs.forEach((proc, i) => {
    const id = `proc-${i}`
    nodes.push({
      id, type: 'data', position: { x: 700, y: procStart + i * 80 },
      data: { kind: 'data', label: proc, subtitle: 'UC procedure', dataVariant: 'procedure',
        sourceFile: `data/demo/proc/${proc}.sql` },
    })
  })

  // Data nodes -- tables
  tables.forEach((table, i) => {
    const id = `table-${i}`
    const fullName = catalog && schemaName ? `${catalog}.${schemaName}.${table}` : table
    nodes.push({
      id, type: 'data', position: { x: 1020, y: 200 + i * 120 },
      data: { kind: 'data', label: table, subtitle: fullName, dataVariant: 'table',
        meta: { catalog, schema: schemaName, table } },
    })
    // Connect genie to tables
    if (genieKeys.length > 0) {
      edges.push({ id: `e-genie-${id}`, source: 'genie', target: id, label: 'queries', animated: true })
    }
  })

  // If no domain content, show empty state message
  if (tools.length === 0 && funcs.length === 0 && tables.length === 0) {
    nodes.push({
      id: 'empty', type: 'data', position: { x: 500, y: 300 },
      data: { kind: 'data', label: 'No domain loaded', subtitle: 'Load a stash to populate the architecture',
        dataVariant: 'table' },
    })
  }

  return {
    nodes,
    edges,
    meta: {
      projectRoot: PROJECT_ROOT,
      generatedAt: new Date().toISOString(),
    },
  }
}

module.exports = { buildGraph }
