'use strict'

/**
 * ConfigProvider — abstract base class for env-config operations.
 * Concrete implementations wrap a specific storage backend (local .env file, remote API, etc.).
 */
class ConfigProvider {
  /** @returns {{ key: string, value: string, sensitive: boolean }[]} */
  list() { throw new Error('not implemented') }

  /** @param {string} key  @returns {string|undefined} */
  get(key) {
    const entry = this.list().find(e => e.key === key)
    return entry ? entry.value : undefined
  }

  /** @param {string} key  @param {string} value */
  set(key, value) { this.setMany({ [key]: value }) }

  /** @param {Record<string, string>} updates */
  setMany(updates) { throw new Error('not implemented') }

  /** @param {string} key — comment-out / disable a single key */
  disable(key) { this.disableMany([key]) }

  /** @param {string[]} keys — comment-out / disable multiple keys */
  disableMany(keys) { throw new Error('not implemented') }

  /** @param {string} key — toggle a key between active and commented-out  @returns {boolean} */
  toggle(key) { throw new Error('not implemented') }

  /** @param {string} prefix  @returns {{ key: string, value: string, enabled: boolean, label: string }[]} */
  listByPrefix(prefix) { throw new Error('not implemented') }

  /** @returns {Record<string, string>} — all active keys as a plain object */
  toEnvDict() {
    const dict = {}
    for (const { key, value } of this.list()) dict[key] = value
    return dict
  }

  /** @param {string} key — permanently remove a key (not just comment-out) */
  deleteKey(key) { throw new Error('not implemented') }
}

/**
 * LocalConfigProvider — wraps the existing .env.local file-based helpers.
 * Delegates to the original functions so behaviour is identical.
 */
class LocalConfigProvider extends ConfigProvider {
  /**
   * @param {string} envFilePath — absolute path to the .env file
   * @param {object} fns — the original helper functions from index.js
   * @param {Function} fns.parseEnvFile
   * @param {Function} fns.writeEnvValues
   * @param {Function} fns.commentOutKeys
   * @param {Function} fns.toggleEnvKey
   * @param {Function} fns.parseMultiInstanceKeys
   */
  constructor(envFilePath, fns) {
    super()
    this._envFile = envFilePath
    this._fns = fns
  }

  list() {
    return this._fns.parseEnvFile()
  }

  setMany(updates) {
    this._fns.writeEnvValues(updates)
  }

  disableMany(keys) {
    this._fns.commentOutKeys(keys)
  }

  toggle(key) {
    return this._fns.toggleEnvKey(key)
  }

  listByPrefix(prefix) {
    return this._fns.parseMultiInstanceKeys(prefix)
  }
}

/**
 * ForgeConfigProvider — reads/writes config from an in-memory zip archive.
 * The zip is flushed to a Databricks UC Volume on every write.
 * Used in SaaS mode (Databricks App). No .env.local.
 *
 * The zip contains a `config.env` file (key=value format, same as .env.local)
 * plus any other project files (SQL, prompts, etc.) managed via getFile/setFile.
 */
class ForgeConfigProvider extends ConfigProvider {
  constructor() {
    super()
    const AdmZip = require('adm-zip')
    this._AdmZip = AdmZip
    this._zip = new AdmZip()
    this._active = new Map()     // key -> value (enabled entries)
    this._disabled = new Map()   // key -> value (commented-out entries)
    this._volumePath = null      // set when schema is configured
    this._host = process.env.DATABRICKS_HOST || ''
    this._token = process.env.DATABRICKS_TOKEN || ''
    this._dirty = false
    this._sensitivePattern = /TOKEN|SECRET|PASSWORD|PAT\b/i
  }

  /** Load from UC Volume. Call once at startup. */
  async init() {
    // Try to derive volume path from env
    const schema = process.env.PROJECT_UNITY_CATALOG_SCHEMA
    if (schema && schema.includes('.')) {
      this._initVolumePath(schema)
      await this._download()
    }
  }

  _initVolumePath(schema) {
    const [catalog, schemaName] = schema.split('.', 2)
    this._volumePath = `/Volumes/${catalog}/${schemaName}/brickforge/stash/current.forge.zip`
  }

  /** Download zip from UC Volume into memory. */
  async _download() {
    if (!this._volumePath || !this._host) return
    try {
      const url = `${this._host.replace(/\/+$/, '')}/api/2.0/fs/files${this._volumePath}`
      const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${this._token}` } })
      if (!resp.ok) return // first run, no zip yet
      const buf = Buffer.from(await resp.arrayBuffer())
      this._zip = new this._AdmZip(buf)
      // Parse config.env from zip
      const configEntry = this._zip.getEntry('config.env')
      if (configEntry) {
        this._parseConfigEnv(configEntry.getData().toString('utf8'))
      }
    } catch { /* first run, no zip */ }
  }

  _parseConfigEnv(raw) {
    this._active.clear()
    this._disabled.clear()
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (trimmed.startsWith('#')) {
        const content = trimmed.replace(/^#\s*/, '')
        const eq = content.indexOf('=')
        if (eq >= 0) {
          this._disabled.set(content.slice(0, eq).trim(), content.slice(eq + 1))
        }
        continue
      }
      const eq = trimmed.indexOf('=')
      if (eq < 0) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1)
      this._active.set(key, value)
    }
  }

  _serializeConfigEnv() {
    const lines = []
    // Active entries
    for (const [key, value] of this._active) {
      lines.push(`${key}=${value}`)
    }
    // Disabled entries (commented out)
    for (const [key, value] of this._disabled) {
      if (!this._active.has(key)) {
        lines.push(`#${key}=${value}`)
      }
    }
    return lines.join('\n') + '\n'
  }

  /** Flush zip to UC Volume. Event-driven: called on every write. */
  async _flush() {
    if (!this._dirty) return
    // Update config.env in zip
    const configContent = this._serializeConfigEnv()
    const existing = this._zip.getEntry('config.env')
    if (existing) {
      this._zip.deleteFile(existing)
    }
    this._zip.addFile('config.env', Buffer.from(configContent, 'utf8'))

    if (!this._volumePath) {
      // Check if schema was just set
      const schema = this._active.get('PROJECT_UNITY_CATALOG_SCHEMA')
      if (schema && schema.includes('.')) {
        this._initVolumePath(schema)
        // Ensure volume exists (best effort)
        await this._ensureVolume(schema)
      } else {
        this._dirty = false
        return // can't flush without volume path, stay in memory
      }
    }

    try {
      const url = `${this._host.replace(/\/+$/, '')}/api/2.0/fs/files${this._volumePath}`
      const zipBuffer = this._zip.toBuffer()
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this._token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: zipBuffer,
      })
      this._dirty = false
    } catch (e) {
      console.error('[forge] flush failed:', e.message || e)
    }
  }

  async _ensureVolume(schema) {
    const [catalog, schemaName] = schema.split('.', 2)
    try {
      // Create volume via SQL (simplest)
      const url = `${this._host.replace(/\/+$/, '')}/api/2.0/sql/statements`
      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this._token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          warehouse_id: this._active.get('DATABRICKS_WAREHOUSE_ID') || '',
          statement: `CREATE VOLUME IF NOT EXISTS ${catalog}.${schemaName}.brickforge`,
          wait_timeout: '30s',
        }),
      })
    } catch { /* best effort */ }
  }

  // ── ConfigProvider interface ──

  list() {
    const entries = []
    const seen = new Set()
    for (const [key, value] of this._active) {
      if (seen.has(key)) continue
      seen.add(key)
      entries.push({ key, value, sensitive: this._sensitivePattern.test(key) })
    }
    return entries
  }

  setMany(updates) {
    for (const [key, value] of Object.entries(updates)) {
      this._active.set(key, value)
      this._disabled.delete(key) // un-disable if was disabled
    }
    this._dirty = true
    this._flush().catch(() => {})
  }

  disableMany(keys) {
    for (const key of keys) {
      const value = this._active.get(key)
      if (value !== undefined) {
        this._disabled.set(key, value)
        this._active.delete(key)
      }
    }
    this._dirty = true
    this._flush().catch(() => {})
  }

  toggle(key) {
    if (this._active.has(key)) {
      // Disable
      this._disabled.set(key, this._active.get(key))
      this._active.delete(key)
    } else if (this._disabled.has(key)) {
      // Enable
      this._active.set(key, this._disabled.get(key))
      this._disabled.delete(key)
    } else {
      return false
    }
    this._dirty = true
    this._flush().catch(() => {})
    return true
  }

  listByPrefix(prefix) {
    const instances = []
    const byKey = new Map()
    // Active entries
    for (const [key, value] of this._active) {
      if (key.startsWith(prefix)) {
        const slug = key.slice(prefix.length)
        byKey.set(key, { key, value, enabled: true, label: slug.toLowerCase().replace(/_/g, ' ') })
      }
    }
    // Disabled entries (active wins if both exist)
    for (const [key, value] of this._disabled) {
      if (key.startsWith(prefix) && !byKey.has(key)) {
        const slug = key.slice(prefix.length)
        byKey.set(key, { key, value, enabled: false, label: slug.toLowerCase().replace(/_/g, ' ') })
      }
    }
    return Array.from(byKey.values())
  }

  deleteKey(key) {
    this._active.delete(key)
    this._disabled.delete(key)
    this._dirty = true
    this._flush().catch(() => {})
  }

  // ── File management (non-config files in the zip) ──

  /** Get a file from the zip archive. */
  getFile(path) {
    const entry = this._zip.getEntry(path)
    return entry ? entry.getData().toString('utf8') : null
  }

  /** Set/update a file in the zip archive. */
  setFile(path, content) {
    const existing = this._zip.getEntry(path)
    if (existing) this._zip.deleteFile(existing)
    this._zip.addFile(path, Buffer.from(content, 'utf8'))
    this._dirty = true
    this._flush().catch(() => {})
  }

  /** Delete a file from the zip archive. */
  deleteFile(path) {
    const existing = this._zip.getEntry(path)
    if (existing) {
      this._zip.deleteFile(existing)
      this._dirty = true
      this._flush().catch(() => {})
    }
  }

  /** List all files in the zip. */
  listFiles() {
    return this._zip.getEntries().map(e => e.entryName).filter(n => n !== 'config.env')
  }
}

module.exports = { ConfigProvider, LocalConfigProvider, ForgeConfigProvider }
