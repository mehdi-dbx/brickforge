'use strict'

/**
 * ProjectManager -- manages multiple .forge projects on UC Volume.
 *
 * Each project is a zip file at:
 *   /Volumes/{catalog}/{schema}/brickforge/stash/{name}.forge.zip
 *
 * The ProjectManager handles:
 *   - List available projects (scan Volume)
 *   - Load a project (download zip, hydrate ForgeConfigProvider)
 *   - Save current project (flush ForgeConfigProvider to Volume)
 *   - Create a new empty project
 *   - Delete a project
 */

class ProjectManager {
  /**
   * @param {string} host -- Databricks workspace URL
   * @param {string} token -- auth token
   */
  constructor(host, token) {
    this._host = (host || '').replace(/\/+$/, '')
    this._token = token || ''
    this._currentProject = null
  }

  /**
   * Derive the Volume base path from a catalog.schema spec.
   * @param {string} schema -- "catalog.schema"
   * @returns {string} -- "/Volumes/catalog/schema/brickforge/stash"
   */
  _volumeBase(schema) {
    if (!schema || !schema.includes('.')) return null
    const [catalog, schemaName] = schema.split('.', 2)
    return `/Volumes/${catalog}/${schemaName}/brickforge/stash`
  }

  /**
   * List all projects in the Volume.
   * @param {string} schema -- "catalog.schema"
   * @returns {Promise<{name: string, path: string, size: number}[]>}
   */
  async listProjects(schema) {
    const base = this._volumeBase(schema)
    if (!base) return []

    try {
      const url = `${this._host}/api/2.0/fs/directories${base}`
      const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this._token}` },
      })
      if (!resp.ok) return [] // Volume doesn't exist yet

      const data = await resp.json()
      const entries = data.contents || []
      return entries
        .filter(e => e.name && e.name.endsWith('.forge.zip'))
        .map(e => ({
          name: e.name.replace('.forge.zip', ''),
          path: `${base}/${e.name}`,
          size: e.file_size || 0,
        }))
    } catch {
      return []
    }
  }

  /**
   * Load a project zip from Volume into memory.
   * @param {string} schema -- "catalog.schema"
   * @param {string} name -- project name (without .forge.zip)
   * @returns {Promise<Buffer|null>} -- zip contents or null
   */
  async loadProject(schema, name) {
    const base = this._volumeBase(schema)
    if (!base) return null

    const zipPath = `${base}/${name}.forge.zip`
    try {
      const url = `${this._host}/api/2.0/fs/files${zipPath}`
      const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this._token}` },
      })
      if (!resp.ok) return null
      const buf = Buffer.from(await resp.arrayBuffer())
      this._currentProject = name
      return buf
    } catch {
      return null
    }
  }

  /**
   * Save a project zip to Volume.
   * @param {string} schema -- "catalog.schema"
   * @param {string} name -- project name
   * @param {Buffer} zipBuffer -- zip contents
   * @returns {Promise<boolean>}
   */
  async saveProject(schema, name, zipBuffer) {
    const base = this._volumeBase(schema)
    if (!base) return false

    // Ensure Volume exists
    await this._ensureVolume(schema)

    const zipPath = `${base}/${name}.forge.zip`
    try {
      const url = `${this._host}/api/2.0/fs/files${zipPath}`
      const resp = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this._token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: zipBuffer,
      })
      this._currentProject = name
      return resp.ok
    } catch {
      return false
    }
  }

  /**
   * Delete a project from Volume.
   * @param {string} schema
   * @param {string} name
   * @returns {Promise<boolean>}
   */
  async deleteProject(schema, name) {
    const base = this._volumeBase(schema)
    if (!base) return false

    const zipPath = `${base}/${name}.forge.zip`
    try {
      const url = `${this._host}/api/2.0/fs/files${zipPath}`
      const resp = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this._token}` },
      })
      if (this._currentProject === name) this._currentProject = null
      return resp.ok
    } catch {
      return false
    }
  }

  /**
   * Ensure the brickforge Volume exists.
   * @param {string} schema
   */
  async _ensureVolume(schema) {
    const [catalog, schemaName] = schema.split('.', 2)
    try {
      // Create stash directory in Volume (Volume must exist)
      const url = `${this._host}/api/2.0/fs/directories/Volumes/${catalog}/${schemaName}/brickforge/stash/`
      await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${this._token}` },
      })
    } catch { /* best effort */ }
  }

  get currentProject() { return this._currentProject }
}

module.exports = { ProjectManager }
