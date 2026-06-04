import { useCallback, useEffect, useRef, useState } from 'react'

interface Resource {
  id: string
  category: string
  name: string
}

interface ExecLine {
  text: string
  stream: 'out' | 'err'
}

type Phase = 'select' | 'running' | 'done'

// Group resources by category for display
const CATEGORY_ORDER = [
  'Databricks App', 'MLflow Experiment', 'Genie Space', 'UC Volume',
  'UC Table', 'UC Function', 'UC Procedure', 'DAB Bundle State', 'config.json cleanup',
]

function groupByCategory(items: Resource[]): [string, Resource[]][] {
  const map = new Map<string, Resource[]>()
  for (const item of items) {
    if (!map.has(item.category)) map.set(item.category, [])
    map.get(item.category)!.push(item)
  }
  return CATEGORY_ORDER.filter(c => map.has(c)).map(c => [c, map.get(c)!])
}

function Terminal({ lines }: { lines: ExecLine[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [lines])

  function color(text: string, stream: string) {
    if (stream === 'err' && !text.startsWith('[+]')) return 'text-dbx-amber'
    if (text.startsWith('[+]') || text.startsWith('\u2713')) return 'text-dbx-blue dark:text-dbx-green'
    if (text.startsWith('[x]') || text.startsWith('\u2717')) return 'text-dbx-error'
    if (text.startsWith('[~]') || text.startsWith('\u25b8') || text.startsWith('...')) return 'text-dbx-amber'
    return 'text-dbx-gray-400'
  }

  return (
    <div ref={ref} className="bg-dbx-gray-950 rounded-lg p-3 font-mono text-[13px] leading-relaxed overflow-y-auto border border-dbx-gray-800/50 shadow-inner flex-1 min-h-0">
      {lines.length === 0 && <div className="text-dbx-gray-600 animate-pulse">running...</div>}
      {lines.map((l, i) => (
        <div key={i} className={`animate-fade-in ${color(l.text.trim(), l.stream)}`}>{l.text.trimEnd()}</div>
      ))}
    </div>
  )
}

export function CleanupView() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [phase, setPhase]         = useState<Phase>('select')
  const [lines, setLines]         = useState<ExecLine[]>([])
  const [ok, setOk]               = useState(false)

  useEffect(() => {
    fetch('/api/cleanup/resources')
      .then(r => r.json() as Promise<{ items: Resource[]; error?: string }>)
      .then(body => {
        if (body.error) setError(body.error)
        else setResources(body.items)
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleCategory = useCallback((ids: string[]) => {
    setSelected(prev => {
      const next = new Set(prev)
      const allOn = ids.every(id => next.has(id))
      for (const id of ids) allOn ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelected(prev => {
      if (prev.size === resources.length) return new Set()
      return new Set(resources.map(r => r.id))
    })
  }, [resources])

  const handleDelete = useCallback(async () => {
    if (selected.size === 0) return
    setPhase('running')
    setLines([])
    try {
      const resp = await fetch('/api/cleanup/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected] }),
      })
      if (!resp.body) { setPhase('done'); return }
      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const chunks = buf.split('\n\n')
        buf = chunks.pop() ?? ''
        for (const chunk of chunks) {
          let evtType = 'message', evtData = ''
          for (const line of chunk.split('\n')) {
            if (line.startsWith('event:')) evtType = line.slice(6).trim()
            if (line.startsWith('data:'))  evtData = line.slice(5).trim()
          }
          if (!evtData) continue
          const parsed = JSON.parse(evtData)
          if (evtType === 'line') setLines(prev => [...prev, parsed])
          else if (evtType === 'done') setOk(parsed.ok)
        }
      }
    } catch (e) {
      setLines(prev => [...prev, { text: '[x] ' + String(e) + '\n', stream: 'err' }])
    }
    setPhase('done')
  }, [selected])

  const handleReset = useCallback(() => {
    setPhase('select')
    setLines([])
    setSelected(new Set())
    setOk(false)
    setLoading(true)
    fetch('/api/cleanup/resources')
      .then(r => r.json() as Promise<{ items: Resource[]; error?: string }>)
      .then(body => {
        if (body.error) setError(body.error)
        else { setResources(body.items); setError('') }
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const groups = groupByCategory(resources)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-dbx-gray-50 dark:bg-dbx-gray-950">
        <div className="text-[13px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono animate-pulse">loading resources...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-dbx-gray-50 dark:bg-dbx-gray-950">
        <div className="text-[13px] text-dbx-error font-mono">[x] {error}</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-dbx-gray-50 dark:bg-dbx-gray-950 overflow-y-auto">
      <div className="max-w-2xl mx-auto flex flex-col p-6 min-h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 font-mono">Cleanup Resources</h2>
            <p className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mt-0.5">
              select resources to delete from the workspace
            </p>
          </div>
          {phase === 'select' && (
            <button
              onClick={selectAll}
              className="text-[11px] font-mono px-3 py-1.5 rounded-md border border-dbx-gray-200 dark:border-dbx-gray-700 text-dbx-gray-500 dark:text-dbx-gray-400 hover:text-dbx-gray-700 dark:hover:text-dbx-gray-200 hover:border-dbx-gray-300 dark:hover:border-dbx-gray-600 transition-all duration-150"
            >
              {selected.size === resources.length ? 'deselect all' : 'select all'}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {groups.map(([cat, items]) => (
            <div key={cat} className="mb-4">
              <button
                onClick={() => phase === 'select' && toggleCategory(items.map(i => i.id))}
                disabled={phase !== 'select'}
                className="flex items-center gap-2 mb-1.5 group"
              >
                <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-all duration-150 ${
                  items.every(i => selected.has(i.id))
                    ? 'bg-dbx-red border-dbx-red dark:border-[#FF6B5A] dark:bg-[#FF6B5A]'
                    : items.some(i => selected.has(i.id))
                      ? 'bg-dbx-red/40 border-dbx-red/40'
                      : 'border-dbx-gray-300 dark:border-dbx-gray-600 group-hover:border-dbx-gray-400 dark:group-hover:border-dbx-gray-500'
                }`}>
                  {items.every(i => selected.has(i.id)) && <span className="text-white text-[8px] leading-none font-bold">✓</span>}
                  {!items.every(i => selected.has(i.id)) && items.some(i => selected.has(i.id)) && <span className="text-white text-[8px] leading-none">–</span>}
                </div>
                <span className="text-[11px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500">{cat}</span>
                <span className="text-[10px] font-mono text-dbx-gray-300 dark:text-dbx-gray-600">{items.length}</span>
              </button>
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => phase === 'select' && toggle(item.id)}
                  disabled={phase !== 'select'}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border mb-1 text-left transition-all duration-150 ${
                    selected.has(item.id)
                      ? 'border-dbx-red/30 dark:border-[#FF6B5A]/30 bg-dbx-red-bg dark:bg-dbx-red-bg-dk'
                      : 'border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 hover:border-dbx-gray-300 dark:hover:border-dbx-gray-700'
                  } ${phase !== 'select' ? 'opacity-60' : ''}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                    selected.has(item.id)
                      ? 'bg-dbx-red border-dbx-red dark:border-[#FF6B5A] dark:bg-[#FF6B5A]'
                      : 'border-dbx-gray-300 dark:border-dbx-gray-600'
                  }`}>
                    {selected.has(item.id) && <span className="text-white text-[9px] leading-none font-bold">✓</span>}
                  </div>
                  <span className="text-[12px] font-mono text-dbx-gray-700 dark:text-dbx-gray-300 truncate">{item.name}</span>
                </button>
              ))}
            </div>
          ))}
          {resources.length === 0 && (
            <div className="text-[13px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono">no deletable resources found</div>
          )}
        </div>

        {/* Action bar */}
        <div className="pt-4 border-t border-dbx-gray-200 dark:border-dbx-gray-800 mt-2 flex-shrink-0">
          {phase === 'select' && (
            <button
              onClick={handleDelete}
              disabled={selected.size === 0}
              className={`w-full text-[14px] py-2.5 rounded-lg font-mono font-medium transition-all duration-200 ${
                selected.size > 0
                  ? 'bg-dbx-red text-white hover:bg-dbx-red-dk shadow-dbx-md hover:shadow-dbx-glow active:scale-[0.98]'
                  : 'bg-dbx-gray-100 dark:bg-dbx-gray-800 text-dbx-gray-300 dark:text-dbx-gray-600 cursor-not-allowed'
              }`}
            >
              delete {selected.size} resource{selected.size !== 1 ? 's' : ''} →
            </button>
          )}
          {phase === 'running' && (
            <button disabled className="w-full text-[14px] py-2.5 rounded-lg bg-dbx-gray-100 dark:bg-dbx-gray-800 text-dbx-gray-300 dark:text-dbx-gray-600 cursor-not-allowed font-mono relative overflow-hidden">
              <span className="relative z-10">deleting...</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dbx-red/5 to-transparent animate-pulse" />
            </button>
          )}
          {phase === 'done' && (
            <button
              onClick={handleReset}
              className="w-full text-[14px] py-2.5 rounded-lg bg-dbx-blue dark:bg-dbx-green text-white font-mono font-medium hover:bg-dbx-blue-dk dark:hover:bg-dbx-green-dk shadow-[0_2px_8px_rgba(46,125,209,0.25)] dark:shadow-[0_2px_8px_rgba(0,169,114,0.25)] transition-all duration-200 active:scale-[0.98]"
            >
              done — refresh
            </button>
          )}
        </div>

        {/* Terminal output (inline, below list) */}
        {phase !== 'select' && (
          <div className="mt-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500">output</div>
              {phase === 'done' && (
                <span className={`text-[11px] font-mono ${ok ? 'text-dbx-blue dark:text-dbx-green' : 'text-dbx-error'}`}>
                  {ok ? '[+] success' : '[x] errors'}
                </span>
              )}
            </div>
            <div className="h-[280px]">
              <Terminal lines={lines} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
