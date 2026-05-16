'use strict'

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') })

const express        = require('express')
const fs             = require('fs')
const path           = require('path')
const { spawn }      = require('child_process')
const { execFile }   = require('child_process')
const multer         = require('multer')
const { buildGraph } = require('./lib/graph-builder')
const { LocalConfigProvider } = require('./lib/config-provider')

const DIST_DIR    = path.resolve(__dirname, '../frontend/dist')
const PORT        = process.env.DATABRICKS_APP_PORT || process.env.VISUAL_PORT || 9000
const LAYOUT_FILE = path.resolve(__dirname, '../graph-layout.json')
const ENV_FILE    = path.resolve(__dirname, '../../.env.local')
const PROJECT_ROOT = path.resolve(__dirname, '../..')
const app         = express()

// Prevent uv "VIRTUAL_ENV does not match" warning in all subprocess calls
delete process.env.VIRTUAL_ENV

const SENSITIVE_PATTERN = /TOKEN|SECRET|PASSWORD|PAT\b|API_KEY/i

// Parse .env.local into ordered list of active entries, preserving raw lines
function parseEnvFile() {
  let raw = ''
  try { raw = fs.readFileSync(ENV_FILE, 'utf8') } catch { return [] }

  const entries = []
  const seen = new Set()

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1)
    if (seen.has(key)) continue  // last active wins — skip duplicates above
    seen.add(key)
    entries.push({ key, value, sensitive: SENSITIVE_PATTERN.test(key) })
  }
  return entries
}

// Update values in .env.local, preserving all comments and structure.
// Only touches the last active (uncommented) line for each key.
function writeEnvValues(updates) {
  let raw = ''
  try { raw = fs.readFileSync(ENV_FILE, 'utf8') } catch { raw = '' }

  const lines = raw.split('\n')
  // Find last active line index for each key
  const lastActive = {}
  lines.forEach((line, i) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const eq = trimmed.indexOf('=')
    if (eq < 0) return
    const key = trimmed.slice(0, eq).trim()
    if (key in updates) lastActive[key] = i
  })

  for (const [key, newVal] of Object.entries(updates)) {
    if (lastActive[key] !== undefined) {
      lines[lastActive[key]] = `${key}=${newVal}`
    } else {
      // Key not present — append
      lines.push(`${key}=${newVal}`)
    }
  }

  // Ensure file ends with a newline
  const content = lines.join('\n')
  fs.writeFileSync(ENV_FILE, content.endsWith('\n') ? content : content + '\n')
}

// Comment out specific keys in .env.local (for switching to same-workspace mode)
function commentOutKeys(keys) {
  let raw = ''
  try { raw = fs.readFileSync(ENV_FILE, 'utf8') } catch { return }
  const keySet = new Set(keys)
  const out = raw.split('\n').map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('#')) return line
    const eq = trimmed.indexOf('=')
    if (eq < 0) return line
    const key = trimmed.slice(0, eq).trim()
    return keySet.has(key) ? '#' + line : line
  })
  fs.writeFileSync(ENV_FILE, out.join('\n'))
}

// Return all env entries (active + commented-out) matching a prefix.
// Returns [{key, value, enabled, label}]
// When a key appears both active and commented, the active entry wins.
function parseMultiInstanceKeys(prefix) {
  let raw = ''
  try { raw = fs.readFileSync(ENV_FILE, 'utf8') } catch { return [] }

  // Collect all entries, active ones override commented-out ones
  const byKey = new Map() // key -> {key, value, enabled, label}

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue

    let enabled = true
    let content = trimmed
    if (content.startsWith('#')) {
      enabled = false
      content = content.replace(/^#\s*/, '')
    }

    const eq = content.indexOf('=')
    if (eq < 0) continue
    const key = content.slice(0, eq).trim()
    const value = content.slice(eq + 1).trim()

    if (!key.startsWith(prefix)) continue

    const existing = byKey.get(key)
    // Active entry always wins over commented-out; later active wins over earlier active
    if (!existing || enabled || (!existing.enabled && !enabled)) {
      const slug = key.slice(prefix.length)
      byKey.set(key, { key, value, enabled, label: slug.toLowerCase().replace(/_/g, ' ') })
    }
  }
  return Array.from(byKey.values())
}

// Toggle a specific env key: comment out if active, uncomment last commented if disabled.
function toggleEnvKey(key) {
  let raw = ''
  try { raw = fs.readFileSync(ENV_FILE, 'utf8') } catch { return false }

  const lines = raw.split('\n')

  // First pass: find the last active line and last commented line for this key
  let lastActiveLine = -1
  let lastCommentLine = -1
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) {
      const content = trimmed.replace(/^#\s*/, '')
      const eq = content.indexOf('=')
      if (eq >= 0 && content.slice(0, eq).trim() === key) lastCommentLine = i
    } else {
      const eq = trimmed.indexOf('=')
      if (eq >= 0 && trimmed.slice(0, eq).trim() === key) lastActiveLine = i
    }
  }

  if (lastActiveLine >= 0) {
    // Active line exists -> comment it out
    lines[lastActiveLine] = '#' + lines[lastActiveLine]
  } else if (lastCommentLine >= 0) {
    // No active, but commented line exists -> uncomment it
    lines[lastCommentLine] = lines[lastCommentLine].replace(/^#\s*/, '')
  } else {
    return false
  }

  fs.writeFileSync(ENV_FILE, lines.join('\n'))
  return true
}

// ConfigProvider instance — mode detection at startup
const { ForgeConfigProvider } = require('./lib/config-provider')
const FORGE_MODE = process.env.FORGE_MODE === 'true' || process.env.DATABRICKS_APP_PORT != null
let config
if (FORGE_MODE) {
  config = new ForgeConfigProvider()
  // Async init — download zip from UC Volume if schema is known
  config.init().then(() => {
    console.log('[forge] ForgeConfigProvider initialized' + (config.get('PROJECT_UNITY_CATALOG_SCHEMA') ? ` (schema: ${config.get('PROJECT_UNITY_CATALOG_SCHEMA')})` : ' (bootstrap phase)'))
  }).catch(e => {
    console.error('[forge] init failed, falling back to empty config:', e.message)
  })
  // Disable CLI profile in deployed mode -- no CLI, no profiles, auth via SP or bridge
  delete process.env.DATABRICKS_CONFIG_PROFILE
} else {
  config = new LocalConfigProvider(ENV_FILE, {
    parseEnvFile,
    writeEnvValues,
    commentOutKeys,
    toggleEnvKey,
    parseMultiInstanceKeys,
  })
}
console.log(`[config] mode: ${FORGE_MODE ? 'FORGE (SaaS)' : 'LOCAL (.env.local)'}`)

// Python command abstraction: 'uv run python' locally, 'python' in Forge/DBX App mode
const PY = FORGE_MODE ? { cmd: 'python', pre: [] } : { cmd: 'uv', pre: ['run', 'python'] }

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})
app.use(express.json())

// Serve pre-built frontend (no Vite / npm needed)
if (fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  app.use(express.static(DIST_DIR))
}

function loadLayout() {
  try {
    return JSON.parse(fs.readFileSync(LAYOUT_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function saveLayout(positions) {
  fs.writeFileSync(LAYOUT_FILE, JSON.stringify(positions, null, 2))
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/graph', (_req, res) => {
  try {
    const graph    = buildGraph()
    const saved    = loadLayout()
    // Merge saved positions over computed defaults
    graph.nodes = graph.nodes.map((n) =>
      saved[n.id] ? { ...n, position: saved[n.id] } : n
    )
    res.json(graph)
  } catch (err) {
    console.error('[graph-builder] error:', err)
    res.status(500).json({ error: String(err) })
  }
})

// PUT /api/layout  body: { id: { x, y }, ... }
app.put('/api/layout', (req, res) => {
  try {
    const positions = req.body
    if (typeof positions !== 'object' || Array.isArray(positions)) {
      return res.status(400).json({ error: 'expected object { nodeId: {x,y} }' })
    }
    saveLayout(positions)
    res.json({ ok: true })
  } catch (err) {
    console.error('[layout] save error:', err)
    res.status(500).json({ error: String(err) })
  }
})

app.get('/api/env', (_req, res) => {
  try {
    res.json(config.list())
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// PUT /api/env  body: { KEY: "new value", ... }
app.put('/api/env', (req, res) => {
  try {
    const updates = req.body
    if (typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({ error: 'expected { KEY: value, ... }' })
    }
    config.setMany(updates)
    res.json({ ok: true })
  } catch (err) {
    console.error('[env] save error:', err)
    res.status(500).json({ error: String(err) })
  }
})

// ─── Stash health endpoint ──────────────────────────────────────────────────

app.get('/api/stash/health', (_req, res) => {
  try {
    const stashDir = path.join(PROJECT_ROOT, 'stash')
    if (!fs.existsSync(stashDir)) return res.json({ stashes: [] })

    const stashes = []
    for (const name of fs.readdirSync(stashDir)) {
      const dir = path.join(stashDir, name)
      if (!fs.statSync(dir).isDirectory()) continue

      const forgeFile = fs.readdirSync(dir).find(f => f.endsWith('.forge'))
      if (!forgeFile) {
        stashes.push({ name, status: 'error', message: 'no .forge manifest', checks: [] })
        continue
      }

      // Parse YAML-like .forge manifest (simple key extraction)
      const raw = fs.readFileSync(path.join(dir, forgeFile), 'utf8')
      const checks = []
      let ok = 0, missing = 0

      // Check referenced files
      const fileRefs = []
      const lines = raw.split('\n')
      for (const line of lines) {
        // Match file references: "file:", "ddl:", "seed:", "system:", "knowledge_base:", "starters:", "config:", "dataset:", "runner:"
        const m = line.match(/^\s+(?:file|ddl|seed|system|knowledge_base|starters|config|dataset|runner):\s*(.+)/)
        if (m) {
          const ref = m[1].trim()
          if (ref && !ref.startsWith('{') && !ref.startsWith('[')) fileRefs.push(ref)
        }
        // Match list items that look like file paths (e.g. "    - some_file.sql")
        const listMatch = line.match(/^\s+-\s+([\w/._-]+\.(?:sql|py|yml|yaml|csv|jsonl|prompt|base|txt))$/)
        if (listMatch) {
          // Determine directory context from preceding section headers
          const idx = lines.indexOf(line)
          let ctx = ''
          for (let i = idx - 1; i >= 0; i--) {
            if (lines[i].match(/^\s+functions:/)) { ctx = 'data/func/'; break }
            if (lines[i].match(/^\s+procedures:/)) { ctx = 'data/proc/'; break }
          }
          if (ctx) fileRefs.push(ctx + listMatch[1])
        }
      }

      for (const ref of fileRefs) {
        const full = path.join(dir, ref)
        if (fs.existsSync(full)) {
          checks.push({ item: ref, status: 'ok' })
          ok++
        } else {
          checks.push({ item: ref, status: 'missing' })
          missing++
        }
      }

      // Check expected directories
      for (const d of ['tools', 'data', 'conf']) {
        if (fs.existsSync(path.join(dir, d))) {
          checks.push({ item: d + '/', status: 'ok' })
          ok++
        } else {
          checks.push({ item: d + '/', status: 'missing' })
          missing++
        }
      }

      // Check bundle templates
      for (const f of ['app.yaml', 'databricks.yml']) {
        if (fs.existsSync(path.join(dir, f))) {
          checks.push({ item: f, status: 'ok' })
          ok++
        } else {
          checks.push({ item: f, status: 'warning', note: 'optional — generated at deploy time' })
        }
      }

      const status = missing === 0 ? 'ok' : 'warning'
      stashes.push({ name, forgeFile, status, ok, missing, checks })
    }

    res.json({ stashes })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ─── Bridge auth endpoints ──────────────────────────────────────────────────

const crypto = require('crypto')
const bridgeNonces = new Map()  // nonce_id -> { value, expires }
let bridgeState = { status: 'waiting' }

// Cleanup expired nonces
function cleanExpiredNonces() {
  const now = Date.now()
  for (const [id, n] of bridgeNonces) {
    if (now > n.expires) bridgeNonces.delete(id)
  }
}

// GET /api/auth/bridge-nonce -- generate a one-time nonce (5 min TTL)
app.get('/api/auth/bridge-nonce', (_req, res) => {
  cleanExpiredNonces()
  const nonceId = crypto.randomBytes(16).toString('hex')
  const nonceValue = crypto.randomBytes(32).toString('hex')
  bridgeNonces.set(nonceId, { value: nonceValue, expires: Date.now() + 5 * 60 * 1000 })
  bridgeState = { status: 'waiting' }
  console.log(`[bridge] nonce generated: id=${nonceId.substring(0, 8)}... TTL=5min, active nonces=${bridgeNonces.size}`)
  res.json({ nonce_id: nonceId, nonce: nonceValue })
})

// POST /api/auth/bridge-receive -- receive encrypted token from local script
app.post('/api/auth/bridge-receive', (req, res) => {
  cleanExpiredNonces()
  const { ciphertext, nonce_id, host, user } = req.body
  console.log(`[bridge] receive: nonce_id=${(nonce_id || '').substring(0, 8)}... host=${host || '?'} user=${user || '?'} ciphertext_len=${(ciphertext || '').length}`)

  if (!ciphertext || !nonce_id) {
    console.log('[bridge] receive REJECTED: missing ciphertext or nonce_id')
    return res.status(400).json({ error: 'ciphertext and nonce_id required' })
  }

  const nonce = bridgeNonces.get(nonce_id)
  if (!nonce) {
    console.log(`[bridge] receive REJECTED: nonce not found (expired or already used). active nonces=${bridgeNonces.size}`)
    return res.status(403).json({ error: 'invalid or expired nonce' })
  }

  try {
    // Decrypt AES-256-CBC (openssl enc compatible format)
    const buf = Buffer.from(ciphertext, 'base64')
    console.log(`[bridge] decrypting: buf_len=${buf.length}, prefix=${buf.subarray(0, 8).toString('ascii')}`)
    // openssl prefixes with "Salted__" (8 bytes) + salt (8 bytes)
    const salt = buf.subarray(8, 16)
    const ct = buf.subarray(16)
    const keyIv = crypto.pbkdf2Sync(nonce.value, salt, 10000, 48, 'sha256')
    const key = keyIv.subarray(0, 32)
    const iv = keyIv.subarray(32, 48)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    const token = decipher.update(ct, undefined, 'utf8') + decipher.final('utf8')

    console.log(`[bridge] decrypted OK: token_len=${token.length}, starts_with=${token.substring(0, 6)}...`)

    if (!token || token.length < 5) {
      console.log(`[bridge] REJECTED: decrypted token is empty or too short (len=${token.length})`)
      return res.status(400).json({ error: 'received empty or invalid token' })
    }

    bridgeNonces.delete(nonce_id)  // single use

    // Store in config -- clear profile to avoid conflicts with new host+token
    const updates = {}
    if (host) updates.DATABRICKS_HOST = host
    updates.DATABRICKS_TOKEN = token
    config.setMany(updates)
    // Remove profile from config AND process.env so SDK uses token auth
    config.disable('DATABRICKS_CONFIG_PROFILE')
    delete process.env.DATABRICKS_CONFIG_PROFILE
    console.log(`[bridge] config saved: host=${host || '(none)'}, token_len=${token.length}`)

    bridgeState = { status: 'connected', host: host || '', user: user || '', time: Date.now() }
    console.log(`[bridge] state -> connected (host=${host}, user=${user})`)
    res.json({ ok: true })
  } catch (err) {
    console.log(`[bridge] decryption FAILED: ${err.message || err}`)
    res.status(400).json({ error: 'decryption failed: ' + (err.message || err) })
  }
})

// GET /api/auth/bridge-status -- frontend polls this
app.get('/api/auth/bridge-status', (_req, res) => {
  if (bridgeState.status === 'connected') console.log(`[bridge] status poll -> connected (host=${bridgeState.host})`)
  res.json(bridgeState)
})

// GET /api/auth/bridge-script -- serve downloadable .command file
app.get('/api/auth/bridge-script', (req, res) => {
  const nonceId = req.query.nonce
  if (!nonceId) {
    console.log('[bridge] script download REJECTED: missing nonce query param')
    return res.status(400).send('nonce query param required')
  }

  const nonce = bridgeNonces.get(nonceId)
  if (!nonce) {
    console.log(`[bridge] script download REJECTED: nonce ${nonceId.substring(0, 8)}... not found or expired`)
    return res.status(403).send('invalid or expired nonce')
  }

  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const appUrl = `${proto}://${host}`
  console.log(`[bridge] script download: nonce=${nonceId.substring(0, 8)}... appUrl=${appUrl}`)

  // Build script from scripts/connect.sh template, injecting only the 3 config vars
  const scriptTemplate = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts', 'connect.sh'), 'utf8')
  const script = scriptTemplate
    .replace(/^APP_URL=.*$/m, `APP_URL="${appUrl}"`)
    .replace(/^NONCE=.*$/m, `NONCE="${nonce.value}"`)
    .replace(/^NONCE_ID=.*$/m, `NONCE_ID="${nonceId}"`)
    // Remove the arg parsing lines (they're for standalone use)
    .replace(/^APP_URL="\$\{1:.*$/m, `APP_URL="${appUrl}"`)
    .replace(/^NONCE="\$\{2:.*$/m, `NONCE="${nonce.value}"`)

  res.setHeader('Content-Disposition', 'attachment; filename=brickforge-connect.command')
  res.setHeader('Content-Type', 'application/octet-stream')
  res.send(script)
})

// ─── Setup endpoints ───────────────────────────────────────────────────────────

const STEP_ENV_KEYS = {
  host:      ['DATABRICKS_HOST'],
  auth:      ['DATABRICKS_TOKEN'],
  warehouse: ['DATABRICKS_WAREHOUSE_ID'],
  schema:    ['PROJECT_UNITY_CATALOG_SCHEMA'],
  tables:    [],  // depends on schema being set + assets created
  functions: [],  // depends on schema + SQL files in func/proc dirs
  model:     ['AGENT_MODEL_ENDPOINT'],
  prompt:    [],  // file-based, not env-based
  genie:     [],  // multi-instance, handled by parseMultiInstanceKeys
  ka:        [],  // multi-instance, handled by parseMultiInstanceKeys
  vs:        ['PROJECT_VS_INDEX'],
  mcp:       [],  // multi-instance, handled separately
  api:       [],  // multi-instance, handled separately
  a2a:       [],  // multi-instance, handled separately
  features:  [],  // multi-instance, handled separately
  lakebase:  ['LAKEBASE_INSTANCE_NAME'],
  mlflow:    ['MLFLOW_EXPERIMENT_ID'],
  grants:    [],  // always re-runnable, no single env key
  deploy:    ['DBX_APP_NAME'],
  git:       [],  // optional, no env key required
}

// GET /api/setup/status — parse .env.local, return per-step status
app.get('/api/setup/status', (_req, res) => {
  try {
    const entries = config.list()
    const env = {}
    for (const { key, value } of entries) env[key] = value

    const steps = {}
    for (const [step, keys] of Object.entries(STEP_ENV_KEYS)) {
      const allSet = keys.length === 0 ? false : keys.every(k => env[k] && env[k].trim())
      let status = keys.length === 0 ? 'unknown' : (allSet ? 'configured' : 'missing')
      let values = Object.fromEntries(keys.map(k => [k, env[k] || '']))

      // Model: same-workspace mode — no AGENT_MODEL_ENDPOINT needed if host+token exist
      if (step === 'model' && !allSet && env.DATABRICKS_HOST && env.DATABRICKS_HOST.trim()) {
        status = 'configured'
        values.AGENT_MODEL_ENDPOINT = env.DATABRICKS_HOST.replace(/\/+$/, '') + ' (same workspace)'
      }

      // Tables step: check if CSVs exist in default or gen
      if (step === 'tables') {
        const defaultCsvDir = path.join(PROJECT_ROOT, 'data', 'default', 'csv')
        const genCsvDir = path.join(PROJECT_ROOT, 'data', 'gen', 'csv')
        let csvCount = 0
        try { csvCount += fs.readdirSync(defaultCsvDir).filter(f => f.endsWith('.csv')).length } catch {}
        try { csvCount += fs.readdirSync(genCsvDir).filter(f => f.endsWith('.csv')).length } catch {}
        status = csvCount > 0 ? 'configured' : 'missing'
        values = { TABLE_COUNT: String(csvCount) }
      }

      // Functions step: check if SQL files exist in func/proc dirs
      if (step === 'functions') {
        let routineCount = 0
        for (const sub of ['func', 'proc']) {
          for (const base of ['data/default', 'data/gen']) {
            const dir = path.join(PROJECT_ROOT, base, sub)
            try { routineCount += fs.readdirSync(dir).filter(f => f.endsWith('.sql')).length } catch {}
          }
        }
        status = routineCount > 0 ? 'configured' : 'missing'
        values = { ROUTINE_COUNT: String(routineCount) }
      }

      // Prompt step: file-based, check if main.prompt exists
      if (step === 'prompt') {
        const promptDir = path.join(PROJECT_ROOT, 'conf', 'prompt')
        const mainExists = fs.existsSync(path.join(promptDir, 'main.prompt'))
        status = mainExists ? 'configured' : 'missing'
        const files = fs.existsSync(promptDir) ? fs.readdirSync(promptDir).filter(f => !f.startsWith('.')) : []
        values = { PROMPT_FILES: files.join(', ') }
      }

      // Multi-instance steps: attach instances array
      if (step === 'genie') {
        const instances = config.listByPrefix('PROJECT_GENIE_')
        steps[step] = { status: instances.some(i => i.enabled) ? 'configured' : (instances.length ? 'missing' : 'missing'), values, instances }
        continue
      }
      if (step === 'ka') {
        const instances = config.listByPrefix('PROJECT_KA_')
        steps[step] = { status: instances.some(i => i.enabled) ? 'configured' : (instances.length ? 'missing' : 'missing'), values, instances }
        continue
      }
      if (step === 'vs') {
        const instances = config.listByPrefix('PROJECT_VS_')
        // Filter to only index entries (not endpoint)
        const indexInstances = instances.filter(i => i.key.includes('INDEX'))
        steps[step] = { status: indexInstances.some(i => i.enabled) ? 'configured' : (indexInstances.length ? 'missing' : 'missing'), values, instances: indexInstances }
        continue
      }
      if (step === 'mcp') {
        const instances = config.listByPrefix('PROJECT_MCP_')
        const serverInstances = instances.filter(i => !i.key.endsWith('_HEADER'))
        steps[step] = { status: serverInstances.some(i => i.enabled) ? 'configured' : (serverInstances.length ? 'missing' : 'missing'), values: {}, instances: serverInstances }
        continue
      }
      if (step === 'a2a') {
        const instances = config.listByPrefix('PROJECT_A2A_')
        const agentInstances = instances.filter(i => !i.key.endsWith('_HEADER'))
        steps[step] = { status: agentInstances.some(i => i.enabled) ? 'configured' : (agentInstances.length ? 'missing' : 'missing'), values: {}, instances: agentInstances }
        continue
      }
      if (step === 'api') {
        // API slugs: filter to only _CONN or _URL entries (not _METHOD, _PATH, etc.)
        const instances = config.listByPrefix('PROJECT_API_')
        const apiInstances = instances.filter(i => i.key.endsWith('_CONN') || i.key.endsWith('_URL'))
        // Derive label from slug: PROJECT_API_WEATHER_CONN -> "weather (uc)" or PROJECT_API_WEATHER_URL -> "weather (http)"
        const labeled = apiInstances.map(i => ({
          ...i,
          label: i.key.replace('PROJECT_API_', '').replace(/_CONN$/, '').replace(/_URL$/, '').toLowerCase()
            + (i.key.endsWith('_CONN') ? ' (uc)' : ' (http)')
        }))
        steps[step] = { status: labeled.some(i => i.enabled) ? 'configured' : (labeled.length ? 'missing' : 'missing'), values: {}, instances: labeled }
        continue
      }
      if (step === 'features') {
        const instances = config.listByPrefix('PROJECT_TOOL_')
        steps[step] = { status: instances.some(i => i.enabled) ? 'configured' : (instances.length ? 'missing' : 'missing'), values: {}, instances }
        continue
      }

      steps[step] = { status, values }
    }

    res.json({ steps, env, forgeMode: FORGE_MODE })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// PUT /api/setup/toggle — enable/disable an env key (comment/uncomment in .env.local)
app.put('/api/setup/toggle', (req, res) => {
  const { key } = req.body
  if (!key || typeof key !== 'string') return res.status(400).json({ error: 'key required' })
  // Only allow toggling PROJECT_GENIE_* and PROJECT_KA_* keys
  if (!key.startsWith('PROJECT_GENIE_') && !key.startsWith('PROJECT_KA_') && !key.startsWith('PROJECT_VS_') && !key.startsWith('PROJECT_MCP_') && !key.startsWith('PROJECT_API_') && !key.startsWith('PROJECT_A2A_') && !key.startsWith('PROJECT_TOOL_')) {
    return res.status(400).json({ error: 'can only toggle genie/ka/vs/mcp/a2a/tool keys' })
  }
  const ok = config.toggle(key)
  res.json({ ok })
})

// DELETE /api/setup/instance — remove an env key (and associated _HEADER) from .env.local
app.delete('/api/setup/instance', (req, res) => {
  const { key } = req.body
  if (!key || typeof key !== 'string') return res.status(400).json({ error: 'key required' })
  const allowed = ['PROJECT_GENIE_', 'PROJECT_KA_', 'PROJECT_VS_', 'PROJECT_MCP_', 'PROJECT_API_', 'PROJECT_A2A_']
  if (!allowed.some(p => key.startsWith(p))) {
    return res.status(400).json({ error: 'can only delete genie/ka/vs/mcp/a2a keys' })
  }
  let raw = ''
  try { raw = fs.readFileSync(ENV_FILE, 'utf8') } catch { return res.json({ ok: false }) }
  const keysToRemove = new Set([key, `${key}_HEADER`])
  const out = raw.split('\n').filter(line => {
    const trimmed = line.trim()
    const content = trimmed.startsWith('#') ? trimmed.replace(/^#\s*/, '') : trimmed
    const eq = content.indexOf('=')
    if (eq < 0) return true
    const lineKey = content.slice(0, eq).trim()
    return !keysToRemove.has(lineKey)
  })
  fs.writeFileSync(ENV_FILE, out.join('\n'))
  res.json({ ok: true })
})

// GET /api/setup/profiles — list databricks CLI profiles
app.get('/api/setup/profiles', (_req, res) => {
  execFile('databricks', ['auth', 'profiles'], { cwd: PROJECT_ROOT, timeout: 10000 }, (err, stdout) => {
    if (err) {
      return res.json({ profiles: [], error: String(err) })
    }
    const lines = stdout.split('\n').slice(1).filter(l => l.trim())
    const profiles = []
    for (const line of lines) {
      const parts = line.trim().split(/\s{2,}/)
      if (parts.length >= 2) {
        const name  = parts[0].trim()
        const host  = parts[1].trim()
        const valid = line.toUpperCase().includes('YES')
        if (name && host) profiles.push({ name, host, valid })
      }
    }
    res.json({ profiles })
  })
})

// GET /api/setup/resources?type=warehouses|catalogs|genie
app.get('/api/setup/resources', (req, res) => {
  const type = req.query.type

  const SCRIPTS = {
    warehouses: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from databricks.sdk import WorkspaceClient; import json
w = WorkspaceClient()
out = [{'id': wh.id, 'name': wh.name, 'state': str(wh.state).split('.')[-1]} for wh in w.warehouses.list()]
print(json.dumps(out))
`.trim(),
    catalogs: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from databricks.sdk import WorkspaceClient; import json
w = WorkspaceClient()
out = [c.name for c in w.catalogs.list() if c.name]
print(json.dumps(out))
`.trim(),
    genie: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from databricks.sdk import WorkspaceClient; import json
w = WorkspaceClient()
try:
  r = w.genie.list_spaces()
  spaces = getattr(r, 'spaces', []) or []
except:
  spaces = []
out = [{'id': str(getattr(s,'space_id',None) or getattr(s,'id','')), 'name': getattr(s,'title','?')} for s in spaces]
print(json.dumps(out))
`.trim(),
    lakebase: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import json
from databricks.sdk import WorkspaceClient
try:
  w = WorkspaceClient()
  instances = list(w.database.list_database_instances())
  out = [{'id': getattr(i,'name',''), 'name': getattr(i,'name',''), 'state': str(getattr(i,'state','UNKNOWN'))} for i in instances]
  print(json.dumps(out))
except Exception:
  print('[]')
`.trim(),
  }

  const script = SCRIPTS[type]
  if (!script) return res.status(400).json({ error: 'unknown type: ' + type })

  execFile(PY.cmd, [...PY.pre, '-c', script], {
    cwd: PROJECT_ROOT,
    timeout: 20000,
  }, (err, stdout, stderr) => {
    if (err) {
      return res.json({ items: [], error: stderr || String(err) })
    }
    try {
      const items = JSON.parse(stdout.trim())
      res.json({ items })
    } catch {
      res.json({ items: [], error: 'parse error: ' + stdout.slice(0, 200) })
    }
  })
})

// POST /api/setup/exec — SSE stream, runs actual setup commands
const PAT_SCRIPT = `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from scripts.py.setup_dbx_env import _profile_for_host, _isolated_client, _redact, write_env_entry, ENV_FILE
import os
host = os.environ['DATABRICKS_HOST'].strip()
profile = _profile_for_host(host)
if not profile: print('[x] No matching CLI profile for', host); exit(1)
w = _isolated_client(profile)
t = w.tokens.create(comment='agent-forge-init', lifetime_seconds=604800)
write_env_entry(ENV_FILE, 'DATABRICKS_TOKEN', t.token_value)
print('[+] PAT generated (7d):', _redact(t.token_value))
`.trim()

const SAVE_WAREHOUSE_SCRIPT = (id) => `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import re; from pathlib import Path
f = Path('.env.local')
lines = f.read_text().splitlines() if f.exists() else []
new = []; found = False
for line in lines:
    m = re.match(r'^([A-Za-z_][A-Za-z0-9_]*)=', line)
    if m and m.group(1) == 'DATABRICKS_WAREHOUSE_ID': new.append('DATABRICKS_WAREHOUSE_ID=${id}'); found = True
    else: new.append(line)
if not found: new.append('DATABRICKS_WAREHOUSE_ID=${id}')
f.write_text('\\n'.join(new) + '\\n')
print('[+] DATABRICKS_WAREHOUSE_ID =', '${id}')
`.trim().replace(/\$\{id\}/g, id)

const SAVE_SCHEMA_SCRIPT = (catalog, schema) => `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from databricks.sdk import WorkspaceClient
import re; from pathlib import Path; import json
w = WorkspaceClient()
spec = '${catalog}.${schema}'
try:
    w.schemas.get(full_name=spec)
    print('[+] schema exists:', spec)
except:
    # Schema does not exist -- check if catalog exists first
    cat_exists = False
    try:
        w.catalogs.get(name='${catalog}')
        cat_exists = True
    except:
        pass
    if cat_exists:
        try:
            w.schemas.create(name='${schema}', catalog_name='${catalog}')
            print('[+] schema created:', spec)
        except Exception as e2:
            print('[x] cannot create schema in catalog ${catalog} -- check permissions:', str(e2)[:200]); exit(1)
    else:
        try:
            w.catalogs.create(name='${catalog}')
            w.schemas.create(name='${schema}', catalog_name='${catalog}')
            print('[+] catalog + schema created:', spec)
        except Exception as e3:
            print('[x]', str(e3)[:200]); exit(1)
f = Path('.env.local')
lines = f.read_text().splitlines() if f.exists() else []
new = []; found = False
for line in lines:
    m = re.match(r'^([A-Za-z_][A-Za-z0-9_]*)=', line)
    if m and m.group(1) == 'PROJECT_UNITY_CATALOG_SCHEMA': new.append('PROJECT_UNITY_CATALOG_SCHEMA=' + spec); found = True
    else: new.append(line)
if not found: new.append('PROJECT_UNITY_CATALOG_SCHEMA=' + spec)
f.write_text('\\n'.join(new) + '\\n')
print('[+] PROJECT_UNITY_CATALOG_SCHEMA =', spec)
`.trim().replace(/\$\{catalog\}/g, catalog).replace(/\$\{schema\}/g, schema)

const SAVE_GENIE_SCRIPT = (id, name) => `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import re; from pathlib import Path
slug = re.sub(r'[^a-z0-9]+', '_', '${name}'.lower()).strip('_').upper() or 'DEFAULT'
env_key = f'PROJECT_GENIE_{slug}'
f = Path('.env.local')
lines = f.read_text().splitlines() if f.exists() else []
new = []; found = False
for line in lines:
    m = re.match(r'^([A-Za-z_][A-Za-z0-9_]*)=', line)
    if m and m.group(1) == env_key: new.append(f'{env_key}=${id}'); found = True
    else: new.append(line)
if not found: new.append(f'{env_key}=${id}')
f.write_text('\\n'.join(new) + '\\n')
print(f'[+] {env_key} = ${id}  (${name})')
`.trim().replace(/\$\{id\}/g, id).replace(/\$\{name\}/g, name)

app.post('/api/setup/exec', (req, res) => {
  const { action, params = {} } = req.body || {}

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Connection', 'keep-alive')

  const write = (type, data) => {
    if (!res.writableEnded) {
      res.write(`event:${type}\ndata:${JSON.stringify(data)}\n\n`)
    }
  }

  const done = (ok, code = ok ? 0 : 1) => {
    write('done', { ok, code })
    if (!res.writableEnded) res.end()
  }

  // Load .env.local vars into subprocess environment
  const envEntries = config.list()
  const subEnv = { ...process.env }
  for (const { key, value } of envEntries) subEnv[key] = value

  function runCommand(cmd, args, extraEnv = {}) {
    let finished = false
    const proc = spawn(cmd, args, {
      cwd: PROJECT_ROOT,
      env: { ...subEnv, ...extraEnv },
    })
    proc.stdout.on('data', d => write('line', { text: d.toString(), stream: 'out' }))
    proc.stderr.on('data', d => {
      const text = d.toString()
      if (text.includes('VIRTUAL_ENV=') && text.includes('will be ignored')) return
      write('line', { text, stream: 'err' })
    })
    proc.on('error', err => {
      write('line', { text: '[x] ' + err.message + '\n', stream: 'err' })
      done(false)
    })
    proc.on('close', code => { finished = true; done(code === 0, code) })
    // Kill child only on premature client disconnect (not on normal request end)
    res.on('close', () => { if (!finished) try { proc.kill() } catch {} })
  }

  function synthetic(lines) {
    for (const line of lines) write('line', { text: line + '\n', stream: 'out' })
    done(true)
  }

  switch (action) {
    case 'exec-pat':
      runCommand(PY.cmd, [...PY.pre, '-c', PAT_SCRIPT])
      break

    case 'exec-assets': {
      const schemaSpec = params.schema || ''
      if (schemaSpec) {
        config.setMany({ PROJECT_UNITY_CATALOG_SCHEMA: schemaSpec })
        subEnv.PROJECT_UNITY_CATALOG_SCHEMA = schemaSpec
      }
      runCommand(PY.cmd, [...PY.pre, 'data/init/create_all_assets.py'])
      break
    }

    case 'exec-tables': {
      // Only create schema + tables (no functions/procedures)
      runCommand(PY.cmd, [...PY.pre, '-c', `
import subprocess, sys
from pathlib import Path
ROOT = Path('.')

print('[~] Creating catalog and schema...')
sys.stdout.flush()
r = subprocess.run(['uv', 'run', 'python', 'data/init/create_catalog_schema.py'], cwd=ROOT)
if r.returncode != 0: print('[x] create_catalog_schema failed'); sys.exit(1)
print('[+] Catalog and schema ready')

# Find table SQL files based on FORGE_STASH_DIR or USE_DEFAULT_DATA / USE_GEN_DATA flags
import os
sql_files = []
stash_dir = os.environ.get('FORGE_STASH_DIR', '').strip()
use_default = os.environ.get('USE_DEFAULT_DATA', 'true').strip().lower()
use_gen = os.environ.get('USE_GEN_DATA', 'false').strip().lower()
if stash_dir:
    print(f'[~] Data source: stash={stash_dir}')
    d = ROOT / stash_dir / 'data' / 'init'
    if d.exists(): sql_files.extend(sorted(d.glob('create_*.sql')))
else:
    print(f'[~] Data sources: default={use_default}, gen={use_gen}')
sys.stdout.flush()
if not stash_dir and use_default in ('true', '1', 'yes'):
    d = ROOT / 'data' / 'default' / 'init'
    if d.exists(): sql_files.extend(sorted(d.glob('create_*.sql')))
if os.environ.get('USE_GEN_DATA', 'false').strip().lower() in ('true', '1', 'yes'):
    d = ROOT / 'data' / 'gen' / 'init'
    if d.exists(): sql_files.extend(sorted(d.glob('create_*.sql')))

if not sql_files:
    print('[~] No table SQL files found'); sys.exit(0)

print(f'[~] Provisioning {len(sql_files)} table(s)...')
sys.stdout.flush()
for i, sf in enumerate(sql_files, 1):
    rel = str(sf.relative_to(ROOT))
    name = sf.stem.replace('create_', '')
    print(f'[~] ({i}/{len(sql_files)}) {name}...')
    sys.stdout.flush()
    r = subprocess.run(['uv', 'run', 'python', 'data/py/run_sql.py', rel], cwd=ROOT)
    if r.returncode != 0: print(f'[x] Failed: {rel}'); sys.exit(1)
    print(f'[+] {name}')
print(f'[+] All {len(sql_files)} table(s) provisioned')
`.trim()])
      break
    }

    case 'exec-functions': {
      // Only create functions + procedures
      runCommand(PY.cmd, [...PY.pre, '-c', `
import subprocess, sys

print('[~] Creating UC functions...')
sys.stdout.flush()
r = subprocess.run(['uv', 'run', 'python', 'data/init/create_all_functions.py'])
if r.returncode != 0: print('[x] create_all_functions failed'); sys.exit(1)

print('[~] Creating UC procedures...')
sys.stdout.flush()
r = subprocess.run(['uv', 'run', 'python', 'data/init/create_all_procedures.py'])
if r.returncode != 0: print('[x] create_all_procedures failed'); sys.exit(1)

print('[+] All functions and procedures created')
`.trim()])
      break
    }

    case 'save-lakebase': {
      const lbName = params.name
      if (!lbName) { done(false); break }
      runCommand(PY.cmd, [...PY.pre, '-c', `
from pathlib import Path; import re
f = Path('.env.local')
key = 'LAKEBASE_INSTANCE_NAME'
val = '${lbName.replace(/'/g, "\\'")}'
lines = f.read_text().splitlines() if f.exists() else []
new = []; found = False
for line in lines:
    m = re.match(r'^([A-Za-z_][A-Za-z0-9_]*)=', line)
    if m and m.group(1) == key: new.append(key + '=' + val); found = True
    else: new.append(line)
if not found: new.append(key + '=' + val)
f.write_text('\\n'.join(new) + '\\n')
print('[+] LAKEBASE_INSTANCE_NAME = ' + val)
`.trim()])
      break
    }

    case 'exec-lakebase':
      runCommand(PY.cmd, [...PY.pre, 'data/init/create_lakebase.py'])
      break

    case 'exec-mlflow':
      runCommand(PY.cmd, [...PY.pre, 'data/init/create_mlflow_experiment.py'])
      break

    case 'exec-grants':
      runCommand(PY.cmd, [...PY.pre, 'deploy/grant/run_all_grants.py'])
      break

    case 'exec-genie': {
      const genieName = params.name || 'Project Data'
      runCommand(PY.cmd, [...PY.pre, 'data/init/create_genie_space.py'], { GENIE_ROOM_NAME: genieName })
      break
    }

    case 'save-host': {
      // Save host from a selected CLI profile
      const profileName = params.profile
      if (!profileName) { write('line', { text: '[x] no profile selected\n', stream: 'err' }); done(false); break }
      runCommand(PY.cmd, [...PY.pre, '-c', `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from scripts.py.setup_dbx_env import write_env_entry, ENV_FILE
import subprocess, json, re
out = subprocess.check_output(['databricks', 'auth', 'profiles'], text=True)
host = None
for line in out.strip().split('\\n')[1:]:
    parts = re.split(r'\\s{2,}', line.strip())
    if len(parts) >= 2 and parts[0].strip() == '${profileName}':
        host = parts[1].strip()
        break
if not host: print('[x] profile not found: ${profileName}'); exit(1)
if not host.startswith('http'): host = 'https://' + host
write_env_entry(ENV_FILE, 'DATABRICKS_HOST', host)
write_env_entry(ENV_FILE, 'DATABRICKS_CONFIG_PROFILE', '${profileName}')
print('[+] DATABRICKS_HOST = ' + host)
print('[+] DATABRICKS_CONFIG_PROFILE = ${profileName}')
`.trim().replace(/\$\{profileName\}/g, profileName)])
      break
    }

    case 'exec-auth-login': {
      // Save host to .env.local, create CLI profile, and run auth login
      const newHost = params.host || ''
      const profName = params.profile || ''
      if (!newHost) { write('line', { text: '[x] no host provided\n', stream: 'err' }); done(false); break }
      const hostUrl = (newHost.startsWith('http') ? newHost : 'https://' + newHost).replace(/\/+$/, '')
      runCommand(PY.cmd, [...PY.pre, '-c', `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from scripts.py.setup_dbx_env import write_env_entry, ENV_FILE
from pathlib import Path
import os, configparser

host = '${hostUrl}'
profile = '${profName}' or host.split('//')[1].split('.')[0]

# Save to .env.local
write_env_entry(ENV_FILE, 'DATABRICKS_HOST', host)
write_env_entry(ENV_FILE, 'DATABRICKS_CONFIG_PROFILE', profile)
print('[+] DATABRICKS_HOST = ' + host)
print('[+] DATABRICKS_CONFIG_PROFILE = ' + profile)

# Add profile to ~/.databrickscfg
cfg_path = Path.home() / '.databrickscfg'
cfg = configparser.ConfigParser()
if cfg_path.exists():
    cfg.read(str(cfg_path))
if not cfg.has_section(profile):
    cfg.add_section(profile)
cfg.set(profile, 'host', host)
cfg.set(profile, 'auth_type', 'databricks-cli')
with open(str(cfg_path), 'w') as f:
    cfg.write(f)
print('[+] profile "' + profile + '" added to ~/.databrickscfg')

# Try auth login (will open browser for OAuth)
import subprocess, sys
print('[~] running databricks auth login (opens browser)...')
sys.stdout.flush()
try:
    result = subprocess.run(
        ['databricks', 'auth', 'login', '--host', host, '--profile', profile],
        timeout=60, capture_output=True, text=True
    )
    if result.returncode == 0:
        print('[+] authenticated via OAuth')
    else:
        err = (result.stderr or result.stdout or '').strip()[:120]
        if err:
            print('[~] auth login returned: ' + err)
        print('[~] profile saved — run "databricks auth login --profile ' + profile + '" manually if OAuth did not complete')
except subprocess.TimeoutExpired:
    print('[~] auth login timed out — profile saved, authenticate manually if needed')
except Exception as e:
    print('[~] auth login failed: ' + str(e)[:80])
    print('[~] profile saved — run "databricks auth login --profile ' + profile + '" manually')
print('[+] done')
`.trim().replace(/\$\{hostUrl\}/g, hostUrl.replace(/'/g, "\\'")).replace(/\$\{profName\}/g, profName.replace(/'/g, "\\'"))])
      break
    }

    case 'save-model-profile': {
      // Pick existing profile for FM workspace, generate PAT, save endpoint+token
      const profileName = params.profile
      if (!profileName) { write('line', { text: '[x] no profile selected\n', stream: 'err' }); done(false); break }
      runCommand(PY.cmd, [...PY.pre, '-c', `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from scripts.py.setup_dbx_env import _profile_for_host, _isolated_client, _redact, write_env_entry, ENV_FILE
import subprocess, re
out = subprocess.check_output(['databricks', 'auth', 'profiles'], text=True)
host = None
for line in out.strip().split('\\n')[1:]:
    parts = re.split(r'\\s{2,}', line.strip())
    if len(parts) >= 2 and parts[0].strip() == '${profileName}':
        host = parts[1].strip()
        break
if not host: print('[x] profile not found: ${profileName}'); exit(1)
if not host.startswith('http'): host = 'https://' + host
endpoint = host.rstrip('/') + '/serving-endpoints/databricks-claude-sonnet-4-6/invocations'
w = _isolated_client('${profileName}')
t = w.tokens.create(comment='agent-forge-fm', lifetime_seconds=604800)
write_env_entry(ENV_FILE, 'AGENT_MODEL_ENDPOINT', endpoint)
write_env_entry(ENV_FILE, 'AGENT_MODEL_TOKEN', t.token_value)
print('[+] AGENT_MODEL_ENDPOINT = ' + endpoint)
print('[+] AGENT_MODEL_TOKEN = ' + _redact(t.token_value))
`.trim().replace(/\$\{profileName\}/g, profileName)])
      break
    }

    case 'exec-ka': {
      runCommand(PY.cmd, [...PY.pre, '-c', `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import subprocess, sys
print('[~] creating Knowledge Assistant from YAML...')
sys.stdout.flush()
subprocess.check_call(['uv', 'run', 'python', 'scripts/py/ka/create_kas_from_yml.py', '--skip-existing'], stdout=sys.stdout, stderr=sys.stderr)
print('[+] Knowledge Assistant provisioned')
`.trim()])
      break
    }

    case 'exec-same': {
      try {
        config.disableMany(['AGENT_MODEL_ENDPOINT', 'AGENT_MODEL_TOKEN'])
        synthetic([
          '[+] same-workspace mode selected',
          '[+] AGENT_MODEL_ENDPOINT commented out (will use DATABRICKS_HOST at runtime)',
          '[+] AGENT_MODEL_TOKEN commented out',
          '[+] ready',
        ])
      } catch (err) {
        write('line', { text: '[x] ' + err.message + '\n', stream: 'err' })
        done(false)
      }
      break
    }

    case 'save-warehouse': {
      const warehouseId = params.id
      if (!warehouseId) { done(false); break }
      runCommand(PY.cmd, [...PY.pre, '-c', SAVE_WAREHOUSE_SCRIPT(warehouseId)])
      break
    }

    case 'save-schema': {
      const { catalog, schema } = params
      if (!catalog || !schema) { done(false); break }
      runCommand(PY.cmd, [...PY.pre, '-c', SAVE_SCHEMA_SCRIPT(catalog, schema)])
      break
    }

    case 'save-genie': {
      const { id: genieId, name: genieName } = params
      if (!genieId) { done(false); break }
      runCommand(PY.cmd, [...PY.pre, '-c', SAVE_GENIE_SCRIPT(genieId, genieName || '')])
      break
    }

    case 'save-deploy-name': {
      const appName = params.name
      if (!appName) { write('line', { text: '[x] no app name provided\n', stream: 'err' }); done(false); break }
      const script = `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from scripts.py.setup_dbx_env import write_env_entry, ENV_FILE
write_env_entry(ENV_FILE, 'DBX_APP_NAME', '${appName.replace(/'/g, "\\'")}')
print('[+] DBX_APP_NAME = ${appName.replace(/'/g, "\\'")}')
`.trim()
      runCommand(PY.cmd, [...PY.pre, '-c', script])
      break
    }

    case 'save-api': {
      const { slug, type, conn, url, method, path: apiPath, desc, apiParams, header } = params
      if (!slug) { write('line', { text: '[x] no API name provided\n', stream: 'err' }); done(false); break }
      const prefix = `PROJECT_API_${slug}`
      const lines = []
      if (type === 'uc' && conn) lines.push(`${prefix}_CONN=${conn}`)
      if (type === 'direct' && url) lines.push(`${prefix}_URL=${url}`)
      if (method && method !== 'GET') lines.push(`${prefix}_METHOD=${method}`)
      if (apiPath && apiPath !== '/') lines.push(`${prefix}_PATH=${apiPath}`)
      if (desc) lines.push(`${prefix}_DESC=${desc}`)
      if (apiParams) lines.push(`${prefix}_PARAMS=${apiParams}`)
      if (header && type === 'direct') lines.push(`${prefix}_HEADER=${header}`)
      if (lines.length === 0) { write('line', { text: '[x] no connection or URL provided\n', stream: 'err' }); done(false); break }
      // Append all lines to .env.local
      const script = `
from pathlib import Path
f = Path('.env.local')
text = f.read_text() if f.exists() else ''
additions = ${JSON.stringify(lines)}
text = text.rstrip('\\n') + '\\n' + '\\n'.join(additions) + '\\n'
f.write_text(text)
for line in additions: print('[+] ' + line)
`.trim()
      runCommand(PY.cmd, [...PY.pre, '-c', script])
      break
    }

    case 'exec-deploy': {
      runCommand('bash', ['deploy/deploy.sh'])
      break
    }

    case 'exec-deploy-dry': {
      runCommand('bash', ['deploy/deploy.sh', '--dry-run'])
      break
    }

    case 'exec-deploy-agent': {
      // SaaS mode: deploy Agent App via SDK (no DAB CLI needed)
      const configDict = config.toEnvDict()
      const tmpConfig = path.join(PROJECT_ROOT, '.tmp-deploy-config.json')
      fs.writeFileSync(tmpConfig, JSON.stringify(configDict, null, 2))
      runCommand(PY.cmd, [...PY.pre, 'deploy/deploy_agent_app.py', '--config', tmpConfig])
      break
    }

    case 'exec-git-push': {
      // Push Agent App project to GitHub via Databricks Git Folders
      const repoUrl = params.repo_url
      if (!repoUrl) { write('line', { text: '[x] repo_url required\n', stream: 'err' }); done(false); break }
      const configDict2 = config.toEnvDict()
      const tmpConfig2 = path.join(PROJECT_ROOT, '.tmp-deploy-config.json')
      fs.writeFileSync(tmpConfig2, JSON.stringify(configDict2, null, 2))
      runCommand(PY.cmd, [...PY.pre, 'deploy/git_push.py', '--repo-url', repoUrl, '--config', tmpConfig2])
      break
    }

    case 'save-multi-instance': {
      const { prefix, slug, url, header } = params
      if (!prefix || !slug || !url) { write('line', { text: '[x] prefix, slug, and url required\n', stream: 'err' }); done(false); break }
      const key = `${prefix}${slug}`
      const updates = { [key]: url }
      if (header) updates[`${key}_HEADER`] = header
      config.setMany(updates)
      const lines = [`[+] ${key} = ${url}`]
      if (header) lines.push(`[+] ${key}_HEADER = ${header.split(':')[0]}:***`)
      synthetic(lines)
      break
    }

    default:
      write('line', { text: '[x] unknown action: ' + action + '\n', stream: 'err' })
      done(false)
  }
})

// GET /api/setup/test?step=<id> — test the live connection for a configured step
const TEST_SCRIPTS = {
  host: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os, urllib.request, json, ssl
host = os.environ.get('DATABRICKS_HOST','').strip().rstrip('/')
token = os.environ.get('DATABRICKS_TOKEN','').strip()
if not host: print('[x] DATABRICKS_HOST not set'); exit(1)
ctx = ssl.create_default_context()
req = urllib.request.Request(host + '/api/2.0/preview/scim/v2/Me')
if token: req.add_header('Authorization', 'Bearer ' + token)
try:
    with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
        d = json.loads(r.read())
        print('[+] reachable — ' + d.get('userName', '?'))
except urllib.error.HTTPError as e:
    if e.code in (401, 403): print('[+] host reachable — proceed to auth')
    else: print('[x] HTTP ' + str(e.code)); exit(1)
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim(),

  auth: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os, urllib.request, json, ssl
host = os.environ.get('DATABRICKS_HOST','').strip().rstrip('/')
token = os.environ.get('DATABRICKS_TOKEN','').strip()
if not host: print('[x] DATABRICKS_HOST not set'); exit(1)
if not token: print('[x] DATABRICKS_TOKEN not set'); exit(1)
ctx = ssl.create_default_context()
try:
    req = urllib.request.Request(host + '/api/2.0/preview/scim/v2/Me', headers={'Authorization': 'Bearer ' + token})
    with urllib.request.urlopen(req, timeout=8, context=ctx) as r:
        d = json.loads(r.read())
        print('[+] authenticated — ' + d.get('userName', '?'))
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim(),

  warehouse: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from databricks.sdk import WorkspaceClient; import os
wh_id = os.environ.get('DATABRICKS_WAREHOUSE_ID','').strip()
if not wh_id: print('[x] DATABRICKS_WAREHOUSE_ID not set'); exit(1)
w = WorkspaceClient()
try:
    wh = w.warehouses.get(wh_id)
    state = str(wh.state).split('.')[-1]
    print('[+] reachable — ' + wh.name + ' (' + state + ')')
except Exception as e:
    msg = str(e)[:150]
    if 'does not exist' in msg or '404' in msg or 'not found' in msg.lower():
        print('[x] warehouse not found in this workspace — pick a new one below')
    else:
        print('[x] ' + msg)
    exit(1)
`.trim(),

  schema: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from databricks.sdk import WorkspaceClient; import os
spec = os.environ.get('PROJECT_UNITY_CATALOG_SCHEMA','').strip()
if not spec: print('[x] PROJECT_UNITY_CATALOG_SCHEMA not set'); exit(1)
w = WorkspaceClient()
try:
    s = w.schemas.get(full_name=spec)
    print('[+] found — ' + (s.full_name or spec))
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim(),

  tables: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from databricks.sdk import WorkspaceClient; import os
from pathlib import Path
spec = os.environ.get('PROJECT_UNITY_CATALOG_SCHEMA','').strip()
if not spec: print('[x] schema not set — configure Unity Catalog first'); exit(1)
root = Path(__file__).resolve().parent if '__file__' in dir() else Path('.')
csvs = []
for d in [root / 'data' / 'default' / 'csv', root / 'data' / 'gen' / 'csv']:
    if d.exists(): csvs.extend(d.glob('*.csv'))
if not csvs: print('[x] no CSVs found — generate or add data first'); exit(1)
w = WorkspaceClient()
found = 0
for csv in csvs:
    tn = csv.stem.replace('-','_')
    try:
        w.tables.get(f'{spec}.{tn}')
        found += 1
    except: pass
print(f'[+] {found}/{len(csvs)} table(s) exist in {spec}')
`.trim(),

  functions: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os, re
from pathlib import Path
spec = os.environ.get('PROJECT_UNITY_CATALOG_SCHEMA','').strip()
if not spec: print('[x] schema not set'); exit(1)
root = Path('.')
func_count = 0
proc_count = 0
for base in ['data/default', 'data/gen']:
    fd = root / base / 'func'
    pd = root / base / 'proc'
    if fd.exists(): func_count += len([f for f in fd.glob('*.sql') if re.search(r'CREATE', f.read_text(), re.I)])
    if pd.exists(): proc_count += len(list(pd.glob('*.sql')))
total = func_count + proc_count
if total == 0: print('[x] no function/procedure SQL files found'); exit(1)
print(f'[+] {func_count} function(s) + {proc_count} procedure(s) ready in {spec}')
`.trim(),

  model: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os, urllib.request, json, ssl, time
endpoint = os.environ.get('AGENT_MODEL_ENDPOINT','').strip()
host = os.environ.get('DATABRICKS_HOST','').strip().rstrip('/')
if not endpoint: endpoint = host + '/serving-endpoints/databricks-claude-sonnet-4-6/invocations'
token = (os.environ.get('AGENT_MODEL_TOKEN','') or os.environ.get('DATABRICKS_TOKEN','')).strip()
if not token: print('[x] no token (AGENT_MODEL_TOKEN or DATABRICKS_TOKEN)'); exit(1)
payload = json.dumps({'messages': [{'role': 'user', 'content': 'Reply with exactly: pong'}], 'max_tokens': 10}).encode()
ctx = ssl.create_default_context()
try:
    t0 = time.time()
    req = urllib.request.Request(endpoint, data=payload, headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=25, context=ctx) as r:
        d = json.loads(r.read())
        ms = int((time.time() - t0) * 1000)
        model = d.get('model','?')
        reply = (d.get('choices',[{}])[0].get('message',{}).get('content','') or '').strip()[:40]
        print('[+] ' + model + ' — ' + str(ms) + 'ms — "' + reply + '"')
except urllib.error.HTTPError as e:
    body = e.read().decode()[:120]
    print('[x] HTTP ' + str(e.code) + ' — ' + body); exit(1)
except urllib.error.URLError as e:
    reason = str(e.reason) if hasattr(e, 'reason') else str(e)
    if 'nodename' in reason or 'Name or service' in reason:
        host_part = endpoint.split('/')[2] if '/' in endpoint else endpoint
        print('[x] DNS failed — cannot reach ' + host_part + ' (check VPN or workspace URL)'); exit(1)
    print('[x] connection failed — ' + reason[:80]); exit(1)
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim(),

  genie: null, // dynamic — uses per-instance test below
  ka: null,    // dynamic — uses per-instance test below
  api: null,   // dynamic — uses per-instance test below

  mlflow: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from databricks.sdk import WorkspaceClient; import os
eid = os.environ.get('MLFLOW_EXPERIMENT_ID','').strip()
if not eid: print('[x] MLFLOW_EXPERIMENT_ID not set'); exit(1)
w = WorkspaceClient()
try:
    exp = w.experiments.get_experiment(experiment_id=eid)
    print('[+] found — ' + getattr(exp, 'name', eid))
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim(),

  lakebase: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os
from databricks.sdk import WorkspaceClient
name = os.environ.get('LAKEBASE_INSTANCE_NAME','').strip()
if not name: print('[x] LAKEBASE_INSTANCE_NAME not set'); exit(1)
try:
    w = WorkspaceClient()
    inst = w.database.get_database_instance(name=name)
    state = str(getattr(inst, 'state', 'UNKNOWN')).upper()
    if 'AVAILABLE' in state or 'ACTIVE' in state: print('[+] available — ' + name)
    else: print('[x] ' + name + ' — ' + state); exit(1)
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim(),

  deploy: `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os
from databricks.sdk import WorkspaceClient
app_name = os.environ.get('DBX_APP_NAME', '').strip()
if not app_name: print('[x] DBX_APP_NAME not set'); exit(1)
try:
    w = WorkspaceClient()
    app = w.apps.get(app_name)
    status = str(getattr(getattr(app, 'app_status', None), 'state', 'UNKNOWN'))
    url = getattr(app, 'url', '') or ''
    if 'RUNNING' in status:
        print('[+] running — ' + (url or app_name))
    elif 'STARTING' in status or 'PENDING' in status:
        print('[+] deploying — ' + status.lower())
    else:
        print('[x] ' + app_name + ' — ' + status)
        exit(1)
except Exception as e:
    err = str(e)[:100]
    if 'not found' in err.lower() or '404' in err:
        print('[x] app not found — deploy first')
    else:
        print('[x] ' + err)
    exit(1)
`.trim(),
}

app.get('/api/setup/test', (req, res) => {
  const step = req.query.step
  const envKey = req.query.key // optional: per-instance key for genie/ka

  // Dynamic test scripts for genie/ka per-instance testing
  let script = TEST_SCRIPTS[step]
  if (step === 'genie') {
    const instances = config.listByPrefix('PROJECT_GENIE_')
    const firstActive = instances.find(i => i.enabled)
    const key = envKey || (firstActive ? firstActive.key : 'PROJECT_GENIE_DEFAULT')
    script = `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from databricks.sdk import WorkspaceClient; import os
sid = os.environ.get('${key}','').strip()
if not sid: print('[x] ${key} not set'); exit(1)
w = WorkspaceClient()
try:
    sp = w.genie.get_space(space_id=sid)
    print('[+] found — ' + getattr(sp, 'title', sid))
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim()
  } else if (step === 'ka') {
    const kaInstances = config.listByPrefix('PROJECT_KA_')
    const firstActiveKa = kaInstances.find(i => i.enabled)
    const key = envKey || (firstActiveKa ? firstActiveKa.key : 'PROJECT_KA_DEFAULT')
    script = `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from databricks.sdk import WorkspaceClient; import os
ka_name = os.environ.get('${key}','').strip()
if not ka_name: print('[x] ${key} not set'); exit(1)
w = WorkspaceClient()
try:
    ep = w.serving_endpoints.get(name=ka_name)
    state = str(ep.state.ready).split('.')[-1] if ep.state else '?'
    print('[+] active — ' + ep.name + ' (' + state + ')')
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim()
  } else if (step === 'vs') {
    const key = envKey || 'PROJECT_VS_INDEX'
    script = `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
from databricks.sdk import WorkspaceClient; import os
idx = os.environ.get('${key}','').strip()
if not idx: print('[x] ${key} not set'); exit(1)
w = WorkspaceClient()
try:
    parts = idx.rsplit('.', 2)
    if len(parts) < 3: print('[x] expected catalog.schema.index format'); exit(1)
    ep = w.vector_search_indexes.get_index(index_name=idx)
    print('[+] found — ' + idx)
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim()
  } else if (step === 'mcp') {
    const key = envKey || ''
    if (!key) return res.json({ ok: false, message: 'no MCP key specified' })
    script = `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os, urllib.request, urllib.error, json
url = os.environ.get('${key}','').strip()
if not url: print('[x] ${key} not set'); exit(1)
# Send MCP initialize request (POST with JSON-RPC)
body = json.dumps({"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"brickforge-test","version":"0.1"}}}).encode()
try:
    req = urllib.request.Request(url, data=body, method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'application/json, text/event-stream')
    header_key = '${key}_HEADER'
    header_val = os.environ.get(header_key, '').strip()
    if header_val and ':' in header_val:
        hname, hval = header_val.split(':', 1)
        req.add_header(hname.strip(), hval.strip())
    resp = urllib.request.urlopen(req, timeout=10)
    print('[+] connected — ' + url)
except urllib.error.HTTPError as e:
    if e.code in (406, 415):
        print('[+] reachable — ' + url + ' (server responded ' + str(e.code) + ')')
    else:
        print('[x] HTTP ' + str(e.code) + ' — ' + url)
        exit(1)
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim()
  } else if (step === 'a2a') {
    const key = envKey || ''
    if (!key) return res.json({ ok: false, message: 'no A2A key specified' })
    script = `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os, urllib.request, urllib.error
url = os.environ.get('${key}','').strip()
if not url: print('[x] ${key} not set'); exit(1)
try:
    req = urllib.request.Request(url, method='GET')
    header_key = '${key}_HEADER'
    header_val = os.environ.get(header_key, '').strip()
    if header_val and ':' in header_val:
        hname, hval = header_val.split(':', 1)
        req.add_header(hname.strip(), hval.strip())
    resp = urllib.request.urlopen(req, timeout=10)
    print('[+] reachable — ' + url + ' (' + str(resp.status) + ')')
except urllib.error.HTTPError as e:
    if e.code in (405, 404, 400):
        print('[+] reachable — ' + url + ' (' + str(e.code) + ')')
    else:
        print('[x] HTTP ' + str(e.code) + ' — ' + url)
        exit(1)
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim()
  } else if (step === 'api') {
    const key = envKey || ''
    if (!key) return res.json({ ok: false, message: 'no API key specified' })
    // Determine if UC connection or direct URL
    const isUc = key.endsWith('_CONN')
    if (isUc) {
      script = `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os
conn = os.environ.get('${key}','').strip()
if not conn: print('[x] ${key} not set'); exit(1)
os.environ.pop('DATABRICKS_CONFIG_PROFILE', None)
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.serving import ExternalFunctionRequestHttpMethod
w = WorkspaceClient()
slug = '${key}'.replace('PROJECT_API_','').replace('_CONN','')
path = os.environ.get(f'PROJECT_API_{slug}_PATH', '/').strip()
method = os.environ.get(f'PROJECT_API_{slug}_METHOD', 'GET').strip()
try:
    resp = w.serving_endpoints.http_request(conn=conn, method=ExternalFunctionRequestHttpMethod(method), path=path)
    print('[+] ' + str(resp.status_code) + ' — ' + conn + ' ' + method + ' ' + path)
except Exception as e:
    print('[x] ' + str(e)[:120]); exit(1)
`.trim()
    } else {
      script = `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os, urllib.request, urllib.error
url = os.environ.get('${key}','').strip()
if not url: print('[x] ${key} not set'); exit(1)
slug = '${key}'.replace('PROJECT_API_','').replace('_URL','')
path = os.environ.get(f'PROJECT_API_{slug}_PATH', '/').strip()
method = os.environ.get(f'PROJECT_API_{slug}_METHOD', 'GET').strip()
full = url.rstrip('/') + '/' + path.lstrip('/')
try:
    req = urllib.request.Request(full, method=method)
    header_val = os.environ.get(f'PROJECT_API_{slug}_HEADER', '').strip()
    if header_val and ':' in header_val:
        hname, hval = header_val.split(':', 1)
        req.add_header(hname.strip(), hval.strip())
    resp = urllib.request.urlopen(req, timeout=10)
    print('[+] ' + str(resp.status) + ' — ' + method + ' ' + full)
except urllib.error.HTTPError as e:
    if e.code in (405, 404, 400):
        print('[+] reachable — ' + full + ' (' + str(e.code) + ')')
    else:
        print('[x] HTTP ' + str(e.code) + ' — ' + full)
        exit(1)
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim()
    }
  } else if (step === 'features') {
    if (envKey === 'PROJECT_TOOL_VOICE') {
      script = `
import os, urllib.request, urllib.error
key = os.environ.get('OPENAI_API_KEY','').strip()
if not key: print('[x] OPENAI_API_KEY not set'); exit(1)
try:
    req = urllib.request.Request('https://api.openai.com/v1/models', headers={'Authorization': f'Bearer {key}'})
    resp = urllib.request.urlopen(req, timeout=10)
    print('[+] OpenAI API key valid (' + str(resp.status) + ')')
except urllib.error.HTTPError as e:
    if e.code == 401: print('[x] invalid API key')
    else: print('[x] OpenAI API error: ' + str(e.code))
    exit(1)
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim()
    } else if (envKey === 'PROJECT_TOOL_CHART') {
      script = `print('[+] chart tool enabled')`
    } else {
      const val = envKey ? process.env[envKey] : ''
      script = val && val.trim().toLowerCase() !== 'false'
        ? `print('[+] ${envKey} enabled')`
        : `print('[x] ${envKey} not enabled'); exit(1)`
    }
  }

  if (!script) return res.json({ ok: false, message: 'no test for step: ' + step })

  execFile(PY.cmd, [...PY.pre, '-c', script], {
    cwd: PROJECT_ROOT,
    timeout: 25000,
  }, (err, stdout, stderr) => {
    const raw = (stdout || '').trim() || (stderr || '').trim()
    const ok = !err && raw.startsWith('[+]')
    const message = raw.replace(/^\[.\] /, '')
    res.json({ ok, message: message || (err ? String(err) : 'no output') })
  })
})

// GET /api/setup/mcp-tools?key=<envKey> — list tools exposed by an MCP server
app.get('/api/setup/mcp-tools', (req, res) => {
  const key = req.query.key
  if (!key) return res.status(400).json({ error: 'key query param required' })

  const script = `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os, urllib.request, urllib.error, json, sys

url = os.environ.get('${key}','').strip()
if not url: print(json.dumps({"error":"${key} not set"})); exit(0)

headers = {'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'}
header_key = '${key}_HEADER'
header_val = os.environ.get(header_key, '').strip()
if header_val and ':' in header_val:
    hname, hval = header_val.split(':', 1)
    headers[hname.strip()] = hval.strip()

def rpc(method, mid, params=None):
    body = {"jsonrpc":"2.0","method":method,"id":mid}
    if params: body["params"] = params
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method='POST')
    for k, v in headers.items(): req.add_header(k, v)
    resp = urllib.request.urlopen(req, timeout=15)
    raw = resp.read().decode()
    # Handle SSE or plain JSON
    for line in raw.split('\\n'):
        line = line.strip()
        if line.startswith('data:'):
            line = line[5:].strip()
        if not line: continue
        try:
            d = json.loads(line)
            if d.get('id') == mid: return d
        except: pass
    return json.loads(raw)

try:
    # Initialize
    init = rpc('initialize', 1, {"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"brickforge","version":"0.1"}})
    # Send initialized notification (no id)
    body = json.dumps({"jsonrpc":"2.0","method":"notifications/initialized"}).encode()
    req2 = urllib.request.Request(url, data=body, method='POST')
    for k, v in headers.items(): req2.add_header(k, v)
    try: urllib.request.urlopen(req2, timeout=5)
    except: pass
    # List tools
    tools_resp = rpc('tools/list', 2)
    tools = tools_resp.get('result', {}).get('tools', [])
    out = [{"name": t.get("name",""), "description": t.get("description","")} for t in tools]
    print(json.dumps({"tools": out}))
except Exception as e:
    print(json.dumps({"error": str(e)[:200]}))
`.trim()

  execFile(PY.cmd, [...PY.pre, '-c', script], {
    cwd: PROJECT_ROOT,
    timeout: 30000,
    env: { ...process.env, ...config.toEnvDict() },
  }, (err, stdout) => {
    try {
      const data = JSON.parse((stdout || '').trim())
      res.json(data)
    } catch {
      res.json({ error: err ? String(err) : 'no response' })
    }
  })
})

// ─── Prompt endpoints ─────────────────────────────────────────────────────────

const PROMPT_DIR = path.join(PROJECT_ROOT, 'conf', 'prompt')

// GET /api/setup/prompts — list prompt files with content
app.get('/api/setup/prompts', (_req, res) => {
  try {
    if (!fs.existsSync(PROMPT_DIR)) return res.json({ files: [] })
    const names = fs.readdirSync(PROMPT_DIR).filter(f => !f.startsWith('.'))
    const files = names.map(name => ({
      name,
      content: fs.readFileSync(path.join(PROMPT_DIR, name), 'utf8'),
    }))
    res.json({ files })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// PUT /api/setup/prompts — save a prompt file
app.put('/api/setup/prompts', (req, res) => {
  try {
    const { name, content } = req.body
    if (!name || typeof content !== 'string') return res.status(400).json({ error: 'name and content required' })
    if (name.includes('/') || name.includes('..')) return res.status(400).json({ error: 'invalid file name' })
    if (!fs.existsSync(PROMPT_DIR)) fs.mkdirSync(PROMPT_DIR, { recursive: true })
    fs.writeFileSync(path.join(PROMPT_DIR, name), content, 'utf8')
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// POST /api/gen/prompt-generate — SSE stream, generates prompt files from domain
app.post('/api/gen/prompt-generate', (req, res) => {
  const { domain, tableSchemas } = req.body || {}
  if (!domain) return res.status(400).json({ error: 'domain is required' })

  const args = [...PY.pre, 'data/gen/generate_prompts.py', '--mode=generate', `--domain=${domain}`]
  if (tableSchemas && tableSchemas.length > 0) {
    args.push(`--tables-json=${JSON.stringify(tableSchemas)}`)
  }
  sseGenRunner(res, PY.cmd, args)
})

// POST /api/gen/prompt-save — save generated prompts to conf/prompt/
app.post('/api/gen/prompt-save', (req, res) => {
  const { main_prompt, knowledge_base, user_prompt } = req.body || {}
  if (!main_prompt) return res.status(400).json({ error: 'main_prompt is required' })

  const stdinData = JSON.stringify({ main_prompt, knowledge_base, user_prompt })
  sseGenRunner(res, PY.cmd, [...PY.pre, 'data/gen/generate_prompts.py', '--mode=save'
  ], stdinData)
})

// ─── Data generation endpoints ────────────────────────────────────────────────

// GET /api/gen/status — check model config + list previously generated tables
app.get('/api/gen/status', (_req, res) => {
  try {
    const entries = config.list()
    const env = {}
    for (const { key, value } of entries) env[key] = value

    const modelReady = !!(
      (env.AGENT_MODEL_ENDPOINT && env.AGENT_MODEL_ENDPOINT.trim()) ||
      (env.DATABRICKS_HOST && env.DATABRICKS_HOST.trim())
    )

    let manifest = null
    const manifestPath = path.join(PROJECT_ROOT, 'data', 'gen', 'manifest.json')
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) } catch {}

    const useDefault = ['true', '1', 'yes'].includes((env.USE_DEFAULT_DATA || 'true').trim().toLowerCase())
    const useGen = ['true', '1', 'yes'].includes((env.USE_GEN_DATA || 'false').trim().toLowerCase())

    res.json({ modelReady, manifest, useDefault, useGen })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// GET /api/gen/tables — dynamic table discovery based on USE_DEFAULT_DATA / USE_GEN_DATA flags
app.get('/api/gen/tables', (_req, res) => {
  try {
    const env = {}
    for (const { key, value } of config.list()) env[key] = value

    const useDefault = (env.USE_DEFAULT_DATA || 'true').trim().toLowerCase()
    const useGen = (env.USE_GEN_DATA || 'false').trim().toLowerCase()

    const sources = []
    if (['true', '1', 'yes'].includes(useDefault)) {
      sources.push({ csvDir: path.join(PROJECT_ROOT, 'data', 'default', 'csv'), initDir: path.join(PROJECT_ROOT, 'data', 'default', 'init'), source: 'default' })
    }
    if (['true', '1', 'yes'].includes(useGen)) {
      sources.push({ csvDir: path.join(PROJECT_ROOT, 'data', 'gen', 'csv'), initDir: path.join(PROJECT_ROOT, 'data', 'gen', 'init'), source: 'generated' })
    }

    const tables = []
    for (const { csvDir, initDir, source } of sources) {
      let csvFiles = []
      try { csvFiles = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv')).sort() } catch {}

      for (const csvFile of csvFiles) {
        const tableName = csvFile.replace('.csv', '').replace(/-/g, '_')
        const sqlFile = path.join(initDir, `create_${tableName}.sql`)

        let columns = []
        try {
          const sql = fs.readFileSync(sqlFile, 'utf8')
          const createMatch = sql.match(/CREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+\S+\s*\(([\s\S]*?)\)\s*\n?\s*USING/i)
          if (createMatch) {
            const colBlock = createMatch[1]
            for (const line of colBlock.split('\n')) {
              const trimmed = line.trim().replace(/,\s*$/, '')
              if (!trimmed) continue
              const parts = trimmed.split(/\s+/)
              if (parts.length >= 2) {
                columns.push({ name: parts[0], type: parts[1] })
              }
            }
          }
        } catch {}

        tables.push({ name: tableName, columns, source })
      }
    }

    res.json({ tables })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// GET /api/gen/routines — dynamic routine discovery (functions + procedures) from default + gen
app.get('/api/gen/routines', (_req, res) => {
  try {
    const env = {}
    for (const { key, value } of config.list()) env[key] = value

    const useDefault = (env.USE_DEFAULT_DATA || 'true').trim().toLowerCase()
    const useGen = (env.USE_GEN_DATA || 'false').trim().toLowerCase()

    const sources = []
    if (['true', '1', 'yes'].includes(useDefault)) {
      sources.push({ base: path.join(PROJECT_ROOT, 'data', 'default'), source: 'default' })
    }
    if (['true', '1', 'yes'].includes(useGen)) {
      sources.push({ base: path.join(PROJECT_ROOT, 'data', 'gen'), source: 'generated' })
    }

    const routines = []
    for (const { base, source } of sources) {
      for (const [kind, subdir] of [['function', 'func'], ['procedure', 'proc']]) {
        const dir = path.join(base, subdir)
        let files = []
        try { files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort() } catch {}
        for (const f of files) {
          const name = f.replace('.sql', '')
          routines.push({ name, kind, source })
        }
      }
    }

    res.json({ routines })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// DELETE /api/gen/clear — remove all generated CSVs, SQL files, and manifest
app.delete('/api/gen/clear', (_req, res) => {
  try {
    let count = 0
    const genCsvDir = path.join(PROJECT_ROOT, 'data', 'gen', 'csv')
    const genInitDir = path.join(PROJECT_ROOT, 'data', 'gen', 'init')
    const manifestPath = path.join(PROJECT_ROOT, 'data', 'gen', 'manifest.json')

    for (const dir of [genCsvDir, genInitDir]) {
      try {
        for (const f of fs.readdirSync(dir)) {
          const fp = path.join(dir, f)
          if (fs.statSync(fp).isFile()) { fs.unlinkSync(fp); count++ }
        }
      } catch {}
    }
    try { fs.unlinkSync(manifestPath); count++ } catch {}

    res.json({ ok: true, removed: count })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Helper: SSE runner for gen endpoints (reuses the pattern from setup/exec)
function sseGenRunner(res, cmd, args, stdinData = null) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Connection', 'keep-alive')

  const write = (type, data) => {
    if (!res.writableEnded) res.write(`event:${type}\ndata:${JSON.stringify(data)}\n\n`)
  }
  const done = (ok, code = ok ? 0 : 1) => {
    write('done', { ok, code })
    if (!res.writableEnded) res.end()
  }

  const envEntries = config.list()
  const subEnv = { ...process.env }
  for (const { key, value } of envEntries) subEnv[key] = value

  let finished = false
  const proc = spawn(cmd, args, { cwd: PROJECT_ROOT, env: subEnv })

  // Buffer stdout to capture __RESULT__ lines
  let stdoutBuf = ''
  proc.stdout.on('data', d => {
    const chunk = d.toString()
    stdoutBuf += chunk
    // Forward lines to SSE, but also check for __RESULT__
    const lines = chunk.split('\n')
    for (const line of lines) {
      if (line.startsWith('__RESULT__:')) {
        try {
          const resultData = JSON.parse(line.slice('__RESULT__:'.length))
          write('result', resultData)
        } catch {}
      } else if (line.trim()) {
        write('line', { text: line + '\n', stream: 'out' })
      }
    }
  })
  proc.stderr.on('data', d => {
    const text = d.toString()
    if (text.includes('VIRTUAL_ENV=') && text.includes('will be ignored')) return
    write('line', { text, stream: 'err' })
  })
  proc.on('error', err => {
    write('line', { text: '[x] ' + err.message + '\n', stream: 'err' })
    done(false)
  })
  proc.on('close', code => { finished = true; done(code === 0, code) })
  res.on('close', () => { if (!finished) try { proc.kill() } catch {} })

  // Write stdin data if provided (for data/save modes)
  if (stdinData) {
    proc.stdin.write(stdinData)
    proc.stdin.end()
  }
}

// POST /api/gen/schema — SSE stream, generates table schemas from domain description
app.post('/api/gen/schema', (req, res) => {
  const { domain } = req.body || {}
  if (!domain) return res.status(400).json({ error: 'domain is required' })

  sseGenRunner(res, PY.cmd, [...PY.pre, 'data/gen/generate_tables.py',
    '--mode=schema', `--domain=${domain}`
  ])
})

// POST /api/gen/data — SSE stream, generates rows for a single table
app.post('/api/gen/data', (req, res) => {
  const { table, contextTables } = req.body || {}
  if (!table) return res.status(400).json({ error: 'table is required' })

  const stdinData = JSON.stringify({ table, contextTables })
  sseGenRunner(res, PY.cmd, [...PY.pre, 'data/gen/generate_tables.py', '--mode=data'
  ], stdinData)
})

// POST /api/gen/save — saves CSV + SQL for a table
app.post('/api/gen/save', (req, res) => {
  const { table, rows, allTables } = req.body || {}
  if (!table || !rows) return res.status(400).json({ error: 'table and rows are required' })

  const stdinData = JSON.stringify({ table, rows, allTables })
  sseGenRunner(res, PY.cmd, [...PY.pre, 'data/gen/generate_tables.py', '--mode=save'
  ], stdinData)
})

// POST /api/gen/provision — SSE stream, runs only generated table SQL
app.post('/api/gen/provision', (req, res) => {
  sseGenRunner(res, PY.cmd, [...PY.pre, 'data/gen/generate_tables.py', '--mode=provision-gen'])
})

// GET /api/gen/wizard-state — return saved wizard state or null
app.get('/api/gen/wizard-state', (_req, res) => {
  const statePath = path.join(PROJECT_ROOT, 'data', 'gen', 'wizard-state.json')
  try {
    const data = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    res.json(data)
  } catch {
    res.json(null)
  }
})

// PUT /api/gen/wizard-state — save wizard state
app.put('/api/gen/wizard-state', (req, res) => {
  const statePath = path.join(PROJECT_ROOT, 'data', 'gen', 'wizard-state.json')
  try {
    const dir = path.dirname(statePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(statePath, JSON.stringify(req.body, null, 2))
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// DELETE /api/gen/wizard-state — clear wizard state
app.delete('/api/gen/wizard-state', (_req, res) => {
  const statePath = path.join(PROJECT_ROOT, 'data', 'gen', 'wizard-state.json')
  try { fs.unlinkSync(statePath) } catch {}
  res.json({ ok: true })
})

// ─── Routine generation endpoints ─────────────────────────────────────────────

// GET /api/gen/routine-status — manifest + model status + table schemas for context
app.get('/api/gen/routine-status', (_req, res) => {
  try {
    const entries = config.list()
    const env = {}
    for (const { key, value } of entries) env[key] = value

    const modelReady = !!(
      (env.AGENT_MODEL_ENDPOINT && env.AGENT_MODEL_ENDPOINT.trim()) ||
      (env.DATABRICKS_HOST && env.DATABRICKS_HOST.trim())
    )

    let routineManifest = null
    const rManifestPath = path.join(PROJECT_ROOT, 'data', 'gen', 'routine_manifest.json')
    try { routineManifest = JSON.parse(fs.readFileSync(rManifestPath, 'utf8')) } catch {}

    // Load table schemas for context (from table manifest)
    let tableSchemas = []
    const tManifestPath = path.join(PROJECT_ROOT, 'data', 'gen', 'manifest.json')
    try {
      const tm = JSON.parse(fs.readFileSync(tManifestPath, 'utf8'))
      tableSchemas = tm.tables || []
    } catch {}

    res.json({ modelReady, routineManifest, tableSchemas })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// POST /api/gen/routine-schema — SSE stream, generates routine schemas
app.post('/api/gen/routine-schema', (req, res) => {
  const { domain, tableSchemas } = req.body || {}
  if (!domain) return res.status(400).json({ error: 'domain is required' })

  const args = [...PY.pre, 'data/gen/generate_routines.py', '--mode=schema', `--domain=${domain}`]
  if (tableSchemas && tableSchemas.length > 0) {
    args.push(`--tables-json=${JSON.stringify(tableSchemas)}`)
  }
  sseGenRunner(res, PY.cmd, args)
})

// POST /api/gen/routine-sql — SSE stream, generates SQL for one routine
app.post('/api/gen/routine-sql', (req, res) => {
  const { routine, tableSchemas } = req.body || {}
  if (!routine) return res.status(400).json({ error: 'routine is required' })

  const stdinData = JSON.stringify({ routine, tableSchemas })
  sseGenRunner(res, PY.cmd, [...PY.pre, 'data/gen/generate_routines.py', '--mode=sql'
  ], stdinData)
})

// POST /api/gen/routine-save — save SQL file for one routine
app.post('/api/gen/routine-save', (req, res) => {
  const { routine, sql, allRoutines } = req.body || {}
  if (!routine || !sql) return res.status(400).json({ error: 'routine and sql are required' })

  const stdinData = JSON.stringify({ routine, sql, allRoutines })
  sseGenRunner(res, PY.cmd, [...PY.pre, 'data/gen/generate_routines.py', '--mode=save'
  ], stdinData)
})

// POST /api/gen/routine-provision — SSE stream, provisions generated procedures
app.post('/api/gen/routine-provision', (req, res) => {
  sseGenRunner(res, PY.cmd, [...PY.pre, 'data/gen/generate_routines.py', '--mode=provision-gen'])
})

// GET /api/gen/routine-wizard-state
app.get('/api/gen/routine-wizard-state', (_req, res) => {
  const statePath = path.join(PROJECT_ROOT, 'data', 'gen', 'routine-wizard-state.json')
  try {
    const data = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    res.json(data)
  } catch {
    res.json(null)
  }
})

// PUT /api/gen/routine-wizard-state
app.put('/api/gen/routine-wizard-state', (req, res) => {
  const statePath = path.join(PROJECT_ROOT, 'data', 'gen', 'routine-wizard-state.json')
  try {
    const dir = path.dirname(statePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(statePath, JSON.stringify(req.body, null, 2))
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// DELETE /api/gen/routine-wizard-state
app.delete('/api/gen/routine-wizard-state', (_req, res) => {
  const statePath = path.join(PROJECT_ROOT, 'data', 'gen', 'routine-wizard-state.json')
  try { fs.unlinkSync(statePath) } catch {}
  res.json({ ok: true })
})

// DELETE /api/gen/clear-routines — remove all generated routine files
app.delete('/api/gen/clear-routines', (_req, res) => {
  try {
    let count = 0
    for (const sub of ['func', 'proc']) {
      const dir = path.join(PROJECT_ROOT, 'data', 'gen', sub)
      if (fs.existsSync(dir)) {
        for (const f of fs.readdirSync(dir)) {
          const fp = path.join(dir, f)
          if (fs.statSync(fp).isFile()) { fs.unlinkSync(fp); count++ }
        }
      }
    }
    const mp = path.join(PROJECT_ROOT, 'data', 'gen', 'routine_manifest.json')
    try { fs.unlinkSync(mp); count++ } catch {}
    const sp = path.join(PROJECT_ROOT, 'data', 'gen', 'routine-wizard-state.json')
    try { fs.unlinkSync(sp) } catch {}
    res.json({ ok: true, cleared: count })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ─── KA document endpoints ───────────────────────────────────────────────────

const upload = multer({ dest: path.join(PROJECT_ROOT, 'data', '.tmp-uploads') })

// GET /api/ka/documents — list files in the KA volume
app.get('/api/ka/documents', (_req, res) => {
  const envEntries = config.list()
  const subEnv = { ...process.env }
  for (const { key, value } of envEntries) subEnv[key] = value

  execFile(PY.cmd, [...PY.pre, 'scripts/py/ka/volume_ops.py', '--mode=list'], {
    cwd: PROJECT_ROOT,
    env: subEnv,
    timeout: 20000,
  }, (err, stdout, stderr) => {
    if (err) return res.json({ files: [], error: stderr || String(err) })
    try { res.json(JSON.parse(stdout.trim())) }
    catch { res.json({ files: [], error: 'parse error: ' + stdout.slice(0, 200) }) }
  })
})

// POST /api/ka/upload — upload file(s) to KA volume
app.post('/api/ka/upload', upload.array('files'), (req, res) => {
  const files = req.files || []
  if (files.length === 0) return res.status(400).json({ ok: false, error: 'no files provided' })

  const envEntries = config.list()
  const subEnv = { ...process.env }
  for (const { key, value } of envEntries) subEnv[key] = value

  const results = []
  let pending = files.length

  for (const file of files) {
    // Rename temp file to preserve original name (multer strips it)
    const destPath = path.join(path.dirname(file.path), file.originalname)
    fs.renameSync(file.path, destPath)

    execFile(PY.cmd, [...PY.pre, 'scripts/py/ka/volume_ops.py', '--mode=upload', `--file=${destPath}`], {
      cwd: PROJECT_ROOT,
      env: subEnv,
      timeout: 60000,
    }, (err, stdout) => {
      // Clean up temp file
      try { fs.unlinkSync(destPath) } catch {}

      if (err) {
        results.push({ name: file.originalname, ok: false, error: String(err) })
      } else {
        try { results.push(JSON.parse(stdout.trim())) }
        catch { results.push({ name: file.originalname, ok: false, error: 'parse error' }) }
      }

      pending--
      if (pending === 0) {
        res.json({ ok: results.every(r => r.ok), uploaded: results })
      }
    })
  }
})

// POST /api/ka/upload-url — download a file from URL and upload to KA volume
app.post('/api/ka/upload-url', (req, res) => {
  const { url } = req.body || {}
  if (!url) return res.status(400).json({ ok: false, error: 'url is required' })

  const envEntries = config.list()
  const subEnv = { ...process.env }
  for (const { key, value } of envEntries) subEnv[key] = value

  const cleanEnv = { ...subEnv, UPLOAD_URL: url }
  console.log('[upload-url] starting for:', url.slice(0, 80))
  const child = execFile(PY.cmd, [...PY.pre, 'scripts/py/ka/volume_ops.py', '--mode=upload-url'], {
    cwd: PROJECT_ROOT,
    env: cleanEnv,
    timeout: 60000,
    maxBuffer: 1024 * 1024,
  }, (err, stdout, stderr) => {
    console.log('[upload-url] done. err:', !!err, 'stdout len:', (stdout||'').length, 'stderr len:', (stderr||'').length)
    const out = (stdout || '').trim()
    if (!out) return res.json({ ok: false, name: url, error: (stderr || String(err || 'no output')).replace(/warning:.*ignored\n?/g, '').trim().slice(0, 200) })
    try { res.json(JSON.parse(out)) }
    catch { res.json({ ok: false, name: url, error: 'parse error: ' + out.slice(0, 200) }) }
  })
  child.on('error', e => console.log('[upload-url] child error:', e))
})

// DELETE /api/ka/documents/:name — delete a file from KA volume
app.delete('/api/ka/documents/:name', (req, res) => {
  const name = req.params.name
  if (!name) return res.status(400).json({ ok: false, error: 'name is required' })

  const envEntries = config.list()
  const subEnv = { ...process.env }
  for (const { key, value } of envEntries) subEnv[key] = value

  execFile(PY.cmd, [...PY.pre, 'scripts/py/ka/volume_ops.py', '--mode=delete', `--name=${name}`], {
    cwd: PROJECT_ROOT,
    env: subEnv,
    timeout: 20000,
  }, (err, stdout) => {
    if (err) return res.json({ ok: false, error: String(err) })
    try { res.json(JSON.parse(stdout.trim())) }
    catch { res.json({ ok: false, error: 'parse error' }) }
  })
})

// ─── Cleanup endpoints ────────────────────────────────────────────────────────

// GET /api/cleanup/resources — list all deletable resources with current values
app.get('/api/cleanup/resources', (_req, res) => {
  const script = `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os, re, json, sys
from pathlib import Path

ROOT = Path('.')
schema_spec = os.environ.get('PROJECT_UNITY_CATALOG_SCHEMA', '').strip()
catalog, schema = schema_spec.split('.', 1) if '.' in schema_spec else ('', '')
wh_id = os.environ.get('DATABRICKS_WAREHOUSE_ID', '').strip()

def parse_names(sql_dir, kind):
    names = []
    d = ROOT / sql_dir
    if not d.exists(): return names
    pat = re.compile(rf'CREATE\\s+(?:OR\\s+REPLACE\\s+)?{kind}\\s+(?:\\w+\\.)*?(\\w+)\\s*\\(', re.IGNORECASE)
    for f in sorted(d.glob('*.sql')):
        for m in pat.finditer(f.read_text()):
            names.append(m.group(1))
    return names

def parse_tables(sql_dir):
    names = []
    d = ROOT / sql_dir
    if not d.exists(): return names
    pat = re.compile(r'CREATE\\s+(?:OR\\s+REPLACE\\s+)?TABLE\\s+(?:\\w+\\.)*?(\\w+)\\s*[\\n(]', re.IGNORECASE)
    for f in sorted(d.glob('*.sql')):
        for m in pat.finditer(f.read_text()):
            names.append(m.group(1))
    return names

from databricks.sdk import WorkspaceClient
w = WorkspaceClient()

def exists_app(name):
    try: w.apps.get(name=name); return True
    except: return False

def exists_experiment(eid):
    try: w.experiments.get_experiment(experiment_id=eid); return True
    except: return False

def exists_genie(sid):
    try: w.genie.get_space(space_id=sid); return True
    except: return False

def exists_volume(full):
    try: w.volumes.read(name=full); return True
    except: return False

def exists_table(full):
    if not wh_id: return False
    try:
        r = w.statement_execution.execute_statement(warehouse_id=wh_id, statement=f"DESCRIBE TABLE {full}", wait_timeout='10s')
        return r.status and str(r.status.state).endswith('SUCCEEDED')
    except: return False

def exists_routine(full, kind):
    if not wh_id: return False
    try:
        r = w.statement_execution.execute_statement(warehouse_id=wh_id, statement=f"DESCRIBE {kind} {full}", wait_timeout='10s')
        return r.status and str(r.status.state).endswith('SUCCEEDED')
    except: return False

resources = []

app_name = os.environ.get('DBX_APP_NAME', '').strip()
if app_name and exists_app(app_name):
    resources.append({'id': 'app', 'category': 'Databricks App', 'name': app_name})

exp_id = os.environ.get('MLFLOW_EXPERIMENT_ID', '').strip()
if exp_id and exists_experiment(exp_id):
    resources.append({'id': 'mlflow', 'category': 'MLflow Experiment', 'name': exp_id})

for gk, gv in sorted(os.environ.items()):
    if gk.startswith('PROJECT_GENIE_') and gv.strip() and exists_genie(gv.strip()):
        resources.append({'id': f'genie:{gk}', 'category': 'Genie Space', 'name': f'{gk}={gv.strip()}'})

if catalog and schema:
    vol_full = f'{catalog}.{schema}.doc'
    if exists_volume(vol_full):
        resources.append({'id': 'volume', 'category': 'UC Volume', 'name': vol_full})
    for tn in parse_tables('data/default/init') + parse_tables('data/gen/init'):
        full = f'{catalog}.{schema}.{tn}'
        if exists_table(full):
            resources.append({'id': f'table:{tn}', 'category': 'UC Table', 'name': full})
    for pn in parse_names('data/default/proc', 'PROCEDURE'):
        full = f'{catalog}.{schema}.{pn}'
        if exists_routine(full, 'FUNCTION'):
            resources.append({'id': f'proc:{pn}', 'category': 'UC Procedure', 'name': full})

bundle = ROOT / '.databricks' / 'bundle'
if bundle.exists():
    resources.append({'id': 'bundle', 'category': 'DAB Bundle State', 'name': '.databricks/bundle/'})

cleanup_keys = [k for k in sorted(os.environ) if k.startswith('PROJECT_GENIE_') and os.environ[k].strip()] + ['MLFLOW_EXPERIMENT_ID']
for key in cleanup_keys:
    if os.environ.get(key, '').strip():
        resources.append({'id': f'env:{key}', 'category': '.env.local cleanup', 'name': f'comment out {key}'})

print(json.dumps(resources))
`.trim()

  execFile(PY.cmd, [...PY.pre, '-c', script], {
    cwd: PROJECT_ROOT,
    timeout: 60000,
  }, (err, stdout, stderr) => {
    if (err) return res.json({ items: [], error: stderr || String(err) })
    try { res.json({ items: JSON.parse(stdout.trim()) }) }
    catch { res.json({ items: [], error: 'parse error: ' + stdout.slice(0, 200) }) }
  })
})

// POST /api/cleanup/exec — SSE stream, deletes selected resources
app.post('/api/cleanup/exec', (req, res) => {
  const { ids = [] } = req.body || {}
  if (!ids.length) return res.json({ ok: false, error: 'no resources selected' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Connection', 'keep-alive')

  const write = (type, data) => {
    if (!res.writableEnded) res.write(`event:${type}\ndata:${JSON.stringify(data)}\n\n`)
  }
  const done = (ok) => {
    write('done', { ok })
    if (!res.writableEnded) res.end()
  }

  const idsJson = JSON.stringify(ids)
  const script = `
from dotenv import load_dotenv; load_dotenv('.env.local', override=True)
import os, re, json, shutil, sys
from pathlib import Path

ROOT = Path('.')
ids = json.loads('${idsJson.replace(/'/g, "\\'")}')

schema_spec = os.environ.get('PROJECT_UNITY_CATALOG_SCHEMA', '').strip()
catalog, schema = schema_spec.split('.', 1) if '.' in schema_spec else ('', '')
wh_id = os.environ.get('DATABRICKS_WAREHOUSE_ID', '').strip()
env_path = ROOT / '.env.local'

from databricks.sdk import WorkspaceClient
w = WorkspaceClient()

def comment_key(key):
    text = env_path.read_text()
    text = re.sub(rf'^({re.escape(key)}=)', r'#\\1', text, flags=re.MULTILINE)
    env_path.write_text(text)

def out(msg): print(msg, flush=True)

errors = 0
for rid in ids:
    try:
        if rid == 'app':
            name = os.environ.get('DBX_APP_NAME', '').strip()
            out(f'[~] deleting app {name}...')
            w.apps.delete(name=name)
            out(f'[+] deleted app: {name}')
        elif rid == 'mlflow':
            eid = os.environ.get('MLFLOW_EXPERIMENT_ID', '').strip()
            out(f'[~] deleting MLflow experiment {eid}...')
            import mlflow
            mlflow.set_tracking_uri('databricks')
            mlflow.delete_experiment(eid)
            out(f'[+] deleted experiment: {eid}')
        elif rid.startswith('genie:'):
            gk = rid.split(':', 1)[1]
            gid = os.environ.get(gk, '').strip()
            if gid:
                out(f'[~] deleting Genie space {gk}={gid}...')
                w.genie.trash_space(space_id=gid)
                out(f'[+] deleted Genie space: {gid}')
        elif rid == 'volume':
            vol = f'{catalog}.{schema}.doc'
            out(f'[~] deleting volume {vol}...')
            w.volumes.delete(name=vol)
            out(f'[+] deleted volume: {vol}')
        elif rid.startswith('table:'):
            tn = rid.split(':', 1)[1]
            full = f'{catalog}.{schema}.{tn}'
            out(f'[~] dropping table {full}...')
            w.statement_execution.execute_statement(warehouse_id=wh_id, statement=f'DROP TABLE IF EXISTS {full}', wait_timeout='30s')
            out(f'[+] dropped table: {full}')
        elif rid.startswith('func:'):
            fn = rid.split(':', 1)[1]
            full = f'{catalog}.{schema}.{fn}'
            out(f'[~] dropping function {full}...')
            w.statement_execution.execute_statement(warehouse_id=wh_id, statement=f'DROP FUNCTION IF EXISTS {full}', wait_timeout='30s')
            out(f'[+] dropped function: {full}')
        elif rid.startswith('proc:'):
            pn = rid.split(':', 1)[1]
            full = f'{catalog}.{schema}.{pn}'
            out(f'[~] dropping procedure {full}...')
            w.statement_execution.execute_statement(warehouse_id=wh_id, statement=f'DROP PROCEDURE IF EXISTS {full}', wait_timeout='30s')
            out(f'[+] dropped procedure: {full}')
        elif rid == 'bundle':
            out('[~] deleting DAB bundle state...')
            shutil.rmtree(ROOT / '.databricks' / 'bundle')
            out('[+] deleted .databricks/bundle/')
        elif rid.startswith('env:'):
            key = rid.split(':', 1)[1]
            out(f'[~] commenting out {key}...')
            comment_key(key)
            out(f'[+] commented out {key}')
    except Exception as e:
        out(f'[x] {rid}: {str(e)[:120]}')
        errors += 1

if errors: out(f'[~] completed with {errors} error(s)')
else: out('[+] cleanup complete')
`.trim()

  const envEntries = config.list()
  const subEnv = { ...process.env }
  for (const { key, value } of envEntries) subEnv[key] = value

  let finished = false
  const proc = spawn(PY.cmd, [...PY.pre, '-c', script], {
    cwd: PROJECT_ROOT,
    env: subEnv,
  })
  proc.stdout.on('data', d => write('line', { text: d.toString(), stream: 'out' }))
  proc.stderr.on('data', d => write('line', { text: d.toString(), stream: 'err' }))
  proc.on('error', err => {
    write('line', { text: '[x] ' + err.message + '\n', stream: 'err' })
    done(false)
  })
  proc.on('close', code => { finished = true; done(code === 0) })
  res.on('close', () => { if (!finished) try { proc.kill() } catch {} })
})

// SPA fallback — serve index.html for non-API routes
// ── Project Management ──────────────────────────────────────────────────────
const { ProjectManager } = require('./lib/project-manager')
const projectManager = new ProjectManager(
  process.env.DATABRICKS_HOST || '',
  process.env.DATABRICKS_TOKEN || ''
)

// GET /api/projects -- list all .forge projects on UC Volume
app.get('/api/projects', async (req, res) => {
  const schema = config.get('PROJECT_UNITY_CATALOG_SCHEMA') || ''
  if (!schema) return res.json({ projects: [], error: 'no schema configured' })
  try {
    const projects = await projectManager.listProjects(schema)
    res.json({ projects, current: projectManager.currentProject })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// POST /api/projects -- create a new empty project
app.post('/api/projects', async (req, res) => {
  const { name } = req.body || {}
  if (!name) return res.status(400).json({ error: 'name required' })
  const schema = config.get('PROJECT_UNITY_CATALOG_SCHEMA') || ''
  if (!schema) return res.status(400).json({ error: 'no schema configured' })
  try {
    const AdmZip = require('adm-zip')
    const zip = new AdmZip()
    zip.addFile('config.env', Buffer.from(`# BrickForge project: ${name}\n`))
    const ok = await projectManager.saveProject(schema, name, zip.toBuffer())
    res.json({ ok, name })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// GET /api/projects/:name -- load a project
app.get('/api/projects/:name', async (req, res) => {
  const schema = config.get('PROJECT_UNITY_CATALOG_SCHEMA') || ''
  if (!schema) return res.status(400).json({ error: 'no schema configured' })
  try {
    const buf = await projectManager.loadProject(schema, req.params.name)
    if (!buf) return res.status(404).json({ error: 'project not found' })
    res.json({ ok: true, name: req.params.name, size: buf.length })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// DELETE /api/projects/:name -- delete a project
app.delete('/api/projects/:name', async (req, res) => {
  const schema = config.get('PROJECT_UNITY_CATALOG_SCHEMA') || ''
  if (!schema) return res.status(400).json({ error: 'no schema configured' })
  try {
    const ok = await projectManager.deleteProject(schema, req.params.name)
    res.json({ ok })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// SPA fallback
const indexHtml = path.join(DIST_DIR, 'index.html')
if (fs.existsSync(indexHtml)) {
  app.get('*', (req, res) => res.sendFile(indexHtml))
}

app.listen(PORT, () => {
  console.log(`[visual] http://localhost:${PORT}`)
})
