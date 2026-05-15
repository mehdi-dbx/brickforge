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

module.exports = { ConfigProvider, LocalConfigProvider }
