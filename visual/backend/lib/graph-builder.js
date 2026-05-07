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

function buildGraph() {
  const appYaml  = readAppYaml()
  const envVars  = extractEnvVars(appYaml)
  const endpoint = envVars['AGENT_MODEL_ENDPOINT'] || ''
  const modelName = parseModelName(endpoint)
  const schema   = envVars['PROJECT_UNITY_CATALOG_SCHEMA'] || 'vibe.main'
  const [catalog, schemaName] = schema.split('.')

  const nodes = [
    // Column 0 — Agent
    {
      id: 'agent',
      type: 'agent',
      position: { x: 80, y: 300 },
      data: {
        kind: 'agent',
        label: 'Agent',
        subtitle: 'LangGraph ResponsesAgent',
        sourceFile: 'agent/agent.py',
        meta: {
          framework: 'LangGraph',
          server: 'MLflow GenAI',
          port: '8000',
        },
      },
    },

    // Column 1 — LLM + Tools + Genie
    {
      id: 'llm',
      type: 'llm',
      position: { x: 380, y: 60 },
      data: {
        kind: 'llm',
        label: modelName,
        subtitle: 'Cross-workspace model endpoint',
        sourceFile: 'app.yaml',
        meta: {
          endpoint: endpoint || '(not set)',
          tokenEnvVar: 'AGENT_MODEL_TOKEN',
        },
      },
    },
    {
      id: 'tool-query',
      type: 'tool',
      position: { x: 380, y: 220 },
      data: {
        kind: 'tool',
        label: 'query_flights_at_risk',
        subtitle: 'SQL read tool',
        sourceFile: 'tools/query_flights_at_risk.py',
        meta: {
          params: 'zone, time_start, time_end',
          returns: 'flight_number, departure_time',
        },
      },
    },
    {
      id: 'tool-update',
      type: 'tool',
      position: { x: 380, y: 360 },
      data: {
        kind: 'tool',
        label: 'update_flight_risk',
        subtitle: 'SQL action tool',
        sourceFile: 'tools/update_flight_risk.py',
        meta: {
          params: 'flight_number, at_risk (bool)',
          sideEffect: 'triggers refresh_table event',
        },
      },
    },
    {
      id: 'genie',
      type: 'genie',
      position: { x: 380, y: 500 },
      data: {
        kind: 'genie',
        label: 'Genie (Check-in)',
        subtitle: 'MCP-based Genie space',
        sourceFile: 'agent/agent.py',
        meta: {
          spaceIdEnvVar: 'PROJECT_GENIE_CHECKIN',
          mcpServerName: 'genie-checkin',
          transport: 'DatabricksMultiServerMCPClient',
        },
      },
    },

    // Column 2 — SQL assets
    {
      id: 'data-func',
      type: 'data',
      position: { x: 700, y: 200 },
      data: {
        kind: 'data',
        label: 'flights_at_risk',
        subtitle: 'SQL function',
        dataVariant: 'function',
        sourceFile: 'data/default/func/flights_at_risk.sql',
        meta: {
          params: 'zone, time_start, time_end',
          returns: 'flight_number, departure_time',
        },
      },
    },
    {
      id: 'data-proc',
      type: 'data',
      position: { x: 700, y: 360 },
      data: {
        kind: 'data',
        label: 'update_flight_risk',
        subtitle: 'SQL procedure',
        dataVariant: 'procedure',
        sourceFile: 'data/default/proc/update_flight_risk.sql',
        meta: {
          params: 'flight_number, at_risk',
          action: 'UPDATE delay_risk field',
        },
      },
    },

    // Column 3 — Delta table
    {
      id: 'data-table',
      type: 'data',
      position: { x: 1020, y: 300 },
      data: {
        kind: 'data',
        label: 'flights',
        subtitle: `${catalog}.${schemaName}.flights`,
        dataVariant: 'table',
        meta: {
          catalog,
          schema: schemaName,
          table: 'flights',
          format: 'Delta (CDF enabled)',
          columns: 'flight_number, zone, departure_time, delay_risk, status',
        },
      },
    },
  ]

  const edges = [
    { id: 'e-agent-llm',      source: 'agent',       target: 'llm',         label: 'uses model' },
    { id: 'e-agent-toolq',    source: 'agent',       target: 'tool-query',  label: 'has tool' },
    { id: 'e-agent-toolu',    source: 'agent',       target: 'tool-update', label: 'has tool' },
    { id: 'e-agent-genie',    source: 'agent',       target: 'genie',       label: 'has MCP tool' },
    { id: 'e-toolq-func',     source: 'tool-query',  target: 'data-func',   label: 'calls' },
    { id: 'e-toolu-proc',     source: 'tool-update', target: 'data-proc',   label: 'calls' },
    { id: 'e-func-table',     source: 'data-func',   target: 'data-table',  label: 'reads',   animated: true },
    { id: 'e-proc-table',     source: 'data-proc',   target: 'data-table',  label: 'writes',  animated: true },
    { id: 'e-genie-table',    source: 'genie',       target: 'data-table',  label: 'queries', animated: true },
  ]

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
