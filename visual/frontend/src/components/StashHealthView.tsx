import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface HealthCheck {
  item: string
  status: 'ok' | 'missing' | 'warning'
  note?: string
}

interface StashHealth {
  name: string
  forgeFile?: string
  status: 'ok' | 'warning' | 'error'
  ok?: number
  missing?: number
  message?: string
  checks: HealthCheck[]
}

interface HealthResponse {
  stashes: StashHealth[]
  error?: string
}

function statusOrb(status: string) {
  if (status === 'ok') return <span className="inline-block w-2 h-2 rounded-full bg-dbx-green mr-2 flex-shrink-0" />
  if (status === 'missing') return <span className="inline-block w-2 h-2 rounded-full bg-dbx-red mr-2 flex-shrink-0" />
  if (status === 'warning') return <span className="inline-block w-2 h-2 rounded-full bg-dbx-amber mr-2 flex-shrink-0" />
  if (status === 'error') return <span className="inline-block w-2 h-2 rounded-full bg-dbx-red mr-2 flex-shrink-0" />
  return <span className="inline-block w-2 h-2 rounded-full bg-dbx-gray-400 mr-2 flex-shrink-0" />
}

function statusLabel(status: string) {
  if (status === 'ok') return '[+]'
  if (status === 'missing') return '[x]'
  if (status === 'warning') return '[!]'
  if (status === 'error') return '[x]'
  return '[?]'
}

function groupChecks(checks: HealthCheck[]): [string, HealthCheck[]][] {
  const groups: [string, HealthCheck[]][] = []
  const dirs = new Map<string, HealthCheck[]>()

  for (const c of checks) {
    let group = 'OTHER'
    if (c.item.startsWith('data/csv/') || c.item.startsWith('data/init/')) group = 'DATA'
    else if (c.item.startsWith('data/func/')) group = 'FUNCTIONS'
    else if (c.item.startsWith('data/proc/')) group = 'PROCEDURES'
    else if (c.item.startsWith('tools/')) group = 'TOOLS'
    else if (c.item.startsWith('conf/prompt/')) group = 'PROMPTS'
    else if (c.item.startsWith('conf/ka/') || c.item.startsWith('conf/vector-search/')) group = 'INTEGRATIONS'
    else if (c.item.startsWith('eval/')) group = 'EVAL'
    else if (c.item.endsWith('/')) group = 'DIRECTORIES'
    else if (c.item === 'app.yaml' || c.item === 'databricks.yml') group = 'BUNDLE'
    else group = 'OTHER'

    if (!dirs.has(group)) dirs.set(group, [])
    dirs.get(group)!.push(c)
  }

  const order = ['DIRECTORIES', 'DATA', 'FUNCTIONS', 'PROCEDURES', 'TOOLS', 'PROMPTS', 'INTEGRATIONS', 'EVAL', 'BUNDLE', 'OTHER']
  for (const key of order) {
    const items = dirs.get(key)
    if (items && items.length > 0) groups.push([key, items])
  }
  return groups
}

export function StashHealthView() {
  const [stashes, setStashes] = useState<StashHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    fetch('/api/stash/health')
      .then(r => r.json() as Promise<HealthResponse>)
      .then(body => {
        if (body.error) setError(body.error)
        else {
          setStashes(body.stashes)
          // Auto-expand all
          setExpanded(new Set(body.stashes.map(s => s.name)))
        }
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const toggleExpand = useCallback((name: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-dbx-gray-200 dark:border-dbx-gray-800">
        <div>
          <h2 className="text-sm font-semibold text-dbx-gray-900 dark:text-dbx-gray-100">Stash Health</h2>
          <p className="text-[11px] text-dbx-gray-500 dark:text-dbx-gray-400 mt-0.5">
            Verify .forge manifest integrity and file completeness
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
            bg-dbx-gray-100 dark:bg-dbx-gray-800 text-dbx-gray-600 dark:text-dbx-gray-300
            hover:bg-dbx-gray-200 dark:hover:bg-dbx-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Reload
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {error && (
          <div className="rounded-lg border border-dbx-red-lt bg-dbx-red-bg dark:bg-dbx-red-bg-dk dark:border-dbx-gray-800 px-4 py-3 text-sm text-dbx-red dark:text-[#FF6B5A] mb-4">
            {error}
          </div>
        )}

        {loading && stashes.length === 0 && (
          <div className="text-sm text-dbx-gray-400 animate-pulse">Scanning stash directory...</div>
        )}

        {!loading && stashes.length === 0 && !error && (
          <div className="text-sm text-dbx-gray-400">No stashes found in stash/ directory.</div>
        )}

        {stashes.map(stash => (
          <div key={stash.name} className="mb-4 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 overflow-hidden">
            {/* Stash header */}
            <button
              onClick={() => toggleExpand(stash.name)}
              className="w-full flex items-center justify-between px-4 py-3 bg-dbx-gray-50 dark:bg-dbx-gray-900/50
                hover:bg-dbx-gray-100 dark:hover:bg-dbx-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {statusOrb(stash.status)}
                <span className="text-sm font-semibold text-dbx-gray-900 dark:text-dbx-gray-100">
                  {stash.name}
                </span>
                {stash.forgeFile && (
                  <span className="text-[11px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono">
                    {stash.forgeFile}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {stash.ok !== undefined && (
                  <span className="text-[11px] text-dbx-green font-mono">{stash.ok} ok</span>
                )}
                {stash.missing !== undefined && stash.missing > 0 && (
                  <span className="text-[11px] text-dbx-red font-mono">{stash.missing} missing</span>
                )}
                {stash.message && (
                  <span className="text-[11px] text-dbx-red">{stash.message}</span>
                )}
                <span className="text-dbx-gray-400 text-xs">{expanded.has(stash.name) ? '\u25BC' : '\u25B6'}</span>
              </div>
            </button>

            {/* Expanded checks */}
            {expanded.has(stash.name) && stash.checks.length > 0 && (
              <div className="px-4 py-3 bg-white dark:bg-dbx-gray-950">
                {groupChecks(stash.checks).map(([group, items]) => (
                  <div key={group} className="mb-3 last:mb-0">
                    <div className="text-[10px] font-semibold text-dbx-gray-400 dark:text-dbx-gray-500 uppercase tracking-wider mb-1.5">
                      {group}
                    </div>
                    {items.map((check, i) => (
                      <div key={i} className="flex items-center gap-2 py-0.5 font-mono text-xs">
                        {statusOrb(check.status)}
                        <span className={
                          check.status === 'ok'
                            ? 'text-dbx-gray-600 dark:text-dbx-gray-300'
                            : check.status === 'missing'
                              ? 'text-dbx-red dark:text-[#FF6B5A]'
                              : 'text-dbx-amber'
                        }>
                          {statusLabel(check.status)}
                        </span>
                        <span className="text-dbx-gray-700 dark:text-dbx-gray-200 truncate">
                          {check.item}
                        </span>
                        {check.note && (
                          <span className="text-dbx-gray-400 dark:text-dbx-gray-500 text-[11px] truncate ml-auto">
                            {check.note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
