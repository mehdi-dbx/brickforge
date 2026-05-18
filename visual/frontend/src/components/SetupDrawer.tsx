import { useCallback, useEffect, useRef, useState } from 'react'
import { Pencil, Upload, Link, Trash2, FileText } from 'lucide-react'
import type { StepId, SetupPhase, DbxProfile, DbxWarehouse, DbxGenieSpace, ExecLine, TableDef } from '../types'
import { GenTerminal } from './GenTerminal'
import { SETUP_STEPS } from '../setupSteps'

export type TestResult = { status: 'idle' | 'loading' | 'ok' | 'fail'; message: string }

interface SetupDrawerProps {
  activeStep: StepId
  phase: SetupPhase
  selectedChoice: number | null
  execLines: ExecLine[]
  currentValues: Record<string, string>
  testCache: Partial<Record<StepId, TestResult>>
  onTestResult: (step: StepId, result: TestResult) => void
  onSelectChoice: (i: number) => void
  onContinue: () => void
  onBack: () => void
  onReconfigure: () => void
  onExecDone: (ok: boolean) => void
  onRefresh: () => void
  onNext?: () => void
  selectedInstanceKey?: string | null
  instances?: { key: string; value: string; enabled: boolean; label: string }[]
  forgeMode?: boolean
}

// ─── Resource hook ─────────────────────────────────────────────────────────────

function useFetchOnce<T>(url: string | null) {
  const [data, setData]       = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  useEffect(() => {
    if (!url) return
    setLoading(true)
    fetch(url)
      .then(r => r.json() as Promise<Record<string, unknown>>)
      .then(body => {
        if (body.error) setError(body.error as string)
        else setData((body.items ?? body.profiles ?? null) as T)
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [url])
  return { data, loading, error }
}

// ─── Resource pickers ──────────────────────────────────────────────────────────

function ProfileList({ selected, onSelect }: { selected: string; onSelect: (n: string) => void }) {
  const { data, loading, error } = useFetchOnce<DbxProfile[]>('/api/setup/profiles')
  const profiles = (data as DbxProfile[]) || []
  if (loading) return <Spinner label="loading profiles…" />
  if (error)   return <ErrMsg msg={error} />
  return (
    <>
      <Label>select cli profile</Label>
      <InfoBox>Profiles marked valid are authenticated and ready to use.</InfoBox>
      {profiles.map(p => (
        <PickRow key={p.name} active={selected === p.name} disabled={!p.valid} onClick={() => p.valid && onSelect(p.name)}>
          <Dot color={p.valid ? 'green' : 'gray'} />
          <span className="flex-1 font-mono text-[13px] text-dbx-gray-800 dark:text-dbx-gray-100 truncate">{p.name}</span>
          <span className="text-[11px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono truncate max-w-[160px]">{p.host.replace('https://', '')}</span>
          {p.valid && <Tag color="green">valid</Tag>}
        </PickRow>
      ))}
    </>
  )
}

function WarehouseList({ selected, onSelect }: { selected: string; onSelect: (id: string, name: string) => void }) {
  const { data, loading, error } = useFetchOnce<DbxWarehouse[]>('/api/setup/resources?type=warehouses')
  const warehouses = (data as DbxWarehouse[]) || []
  if (loading) return <Spinner label="loading warehouses…" />
  if (error)   return <ErrMsg msg={error} />
  return (
    <>
      <Label>available warehouses</Label>
      {warehouses.map(wh => {
        const running = wh.state?.toUpperCase().includes('RUNNING')
        return (
          <PickRow key={wh.id} active={selected === wh.id} onClick={() => onSelect(wh.id, wh.name)}>
            <Dot color={running ? 'green' : 'gray'} />
            <span className="flex-1 font-mono text-[13px] text-dbx-gray-800 dark:text-dbx-gray-100">{wh.name}</span>
            {running && <Tag color="green">running</Tag>}
          </PickRow>
        )
      })}
    </>
  )
}

function CatalogPicker({ catalog, schema, onCatalog, onSchema }: {
  catalog: string; schema: string; onCatalog: (c: string) => void; onSchema: (s: string) => void
}) {
  const { data, loading, error } = useFetchOnce<string[]>('/api/setup/resources?type=catalogs')
  const catalogs = (data as string[]) || []
  if (loading) return <Spinner label="loading catalogs…" />
  if (error)   return <ErrMsg msg={error} />
  return (
    <>
      <Label>available catalogs</Label>
      {catalogs.map(c => (
        <PickRow key={c} active={catalog === c} onClick={() => onCatalog(c)}>
          <Dot color="green" />
          <span className="font-mono text-[13px] text-dbx-gray-800 dark:text-dbx-gray-100">{c}</span>
        </PickRow>
      ))}
      <div className="mt-3">
        <Label>schema name</Label>
        <input
          value={schema}
          onChange={e => onSchema(e.target.value)}
          placeholder="main"
          className="w-full text-[14px] font-mono bg-white dark:bg-dbx-gray-900 border-2 border-dbx-green dark:border-dbx-green rounded-lg px-3 py-2.5 outline-none focus:border-dbx-green focus:shadow-[0_0_8px_rgba(0,169,114,0.2)] text-dbx-gray-800 dark:text-dbx-gray-100 placeholder:text-dbx-gray-300 dark:placeholder:text-dbx-gray-600 transition-all duration-150"
        />
      </div>
    </>
  )
}

function GenieList({ selected, onSelect }: { selected: string; onSelect: (id: string, name: string) => void }) {
  const { data, loading, error } = useFetchOnce<DbxGenieSpace[]>('/api/setup/resources?type=genie')
  const spaces = (data as DbxGenieSpace[]) || []
  if (loading) return <Spinner label="loading genie spaces…" />
  if (error)   return <ErrMsg msg={error} />
  if (spaces.length === 0) return <InfoBox>No genie spaces found — use "create new room" instead.</InfoBox>
  return (
    <>
      <Label>available genie spaces</Label>
      {spaces.map(s => (
        <PickRow key={s.id} active={selected === s.id} onClick={() => onSelect(s.id, s.name)}>
          <Dot color="green" />
          <span className="flex-1 font-mono text-[13px] text-dbx-gray-800 dark:text-dbx-gray-100">{s.name}</span>
          <span className="text-[11px] text-dbx-gray-400 dark:text-dbx-gray-600 font-mono">{s.id.slice(0, 8)}…</span>
        </PickRow>
      ))}
    </>
  )
}

function LakebaseList({ selected, onSelect }: { selected: string; onSelect: (name: string) => void }) {
  const { data, loading, error } = useFetchOnce<{ id: string; name: string; state: string }[]>('/api/setup/resources?type=lakebase')
  const instances = (data as { id: string; name: string; state: string }[]) || []
  if (loading) return <Spinner label="loading lakebase instances…" />
  if (error)   return <ErrMsg msg={error} />
  if (instances.length === 0) return <InfoBox>No Lakebase instances found -- use "create instance" instead.</InfoBox>
  return (
    <>
      <Label>available lakebase instances</Label>
      {instances.map(i => (
        <PickRow key={i.name} active={selected === i.name} onClick={() => onSelect(i.name)}>
          <Dot color={i.state === 'AVAILABLE' ? 'green' : i.state === 'CREATING' ? 'amber' : 'red'} />
          <span className="flex-1 font-mono text-[13px] text-dbx-gray-800 dark:text-dbx-gray-100">{i.name}</span>
          <span className="text-[11px] text-dbx-gray-400 dark:text-dbx-gray-600 font-mono">{i.state}</span>
        </PickRow>
      ))}
    </>
  )
}

// ─── KA document picker ───────────────────────────────────────────────────────

interface VolumeFile { name: string; path: string; size: number; modified: string | null }

function KaDocsPicker({ onReady }: { onReady: (ready: boolean) => void }) {
  const [files, setFiles] = useState<VolumeFile[]>([])
  const [volumePath, setVolumePath] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlUploading, setUrlUploading] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean }[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(() => {
    setLoading(true)
    setError('')
    fetch('/api/ka/documents')
      .then(r => r.json())
      .then(data => {
        const f = data.files || []
        setFiles(f)
        setVolumePath(data.volumePath || '')
        if (data.error && f.length === 0) setError(data.error)
        onReady(f.length > 0)
      })
      .catch(e => { setError(String(e)); onReady(false) })
      .finally(() => setLoading(false))
  }, [onReady])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected || selected.length === 0) return
    setUploading(true)
    setFeedback([])
    const formData = new FormData()
    for (const file of Array.from(selected)) formData.append('files', file)
    try {
      const resp = await fetch('/api/ka/upload', { method: 'POST', body: formData })
      const data = await resp.json()
      const results = (data.uploaded || []).map((r: { name: string; ok: boolean; error?: string }) => ({
        text: r.ok ? `[+] ${r.name}` : `[x] ${r.name} -- ${r.error || 'failed'}`,
        ok: r.ok,
      }))
      setFeedback(results)
      fetchDocs()
    } catch (err) {
      setFeedback([{ text: `[x] upload failed: ${err}`, ok: false }])
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUrlUpload = async () => {
    const url = urlInput.trim()
    if (!url) return
    setUrlUploading(true)
    setFeedback([])
    try {
      const resp = await fetch('/api/ka/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await resp.json()
      const steps = (data.steps || []).map((s: string) => ({
        text: s,
        ok: s.startsWith('[+]'),
      }))
      steps.push({ text: data.ok ? `[+] ${data.name}` : `[x] ${data.name} -- ${data.error || 'failed'}`, ok: data.ok })
      setFeedback(steps)
      if (data.ok) setUrlInput('')
      fetchDocs()
    } catch (err) {
      setFeedback([{ text: `[x] fetch failed: ${err}`, ok: false }])
    } finally {
      setUrlUploading(false)
    }
  }

  const handleDelete = async (name: string) => {
    setDeleting(name)
    try {
      await fetch(`/api/ka/documents/${encodeURIComponent(name)}`, { method: 'DELETE' })
      fetchDocs()
    } catch {}
    setDeleting(null)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) return <Spinner label="loading volume documents..." />

  return (
    <div className="space-y-3">
      <Label>documents in volume</Label>
      {volumePath && (
        <div className="text-[10px] font-mono text-dbx-gray-400 dark:text-dbx-gray-600 -mt-1 mb-2 truncate">{volumePath}</div>
      )}

      {error && <div className="text-[11px] font-mono text-dbx-amber">[~] {error}</div>}

      {/* File list */}
      {files.length > 0 ? (
        <div className="rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 overflow-hidden">
          {files.map((file, i) => (
            <div
              key={file.name}
              className={`flex items-center gap-2 px-3 py-2 group ${
                i < files.length - 1 ? 'border-b border-dbx-gray-100 dark:border-dbx-gray-800/50' : ''
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-dbx-gray-300 dark:text-dbx-gray-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-mono text-dbx-gray-700 dark:text-dbx-gray-200 truncate">{file.name}</div>
                <div className="text-[10px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500">{formatSize(file.size)}</div>
              </div>
              <button
                onClick={() => handleDelete(file.name)}
                disabled={deleting === file.name}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-dbx-gray-300 hover:text-red-500 transition-all disabled:opacity-50"
                title="Delete from volume"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <InfoBox>No documents in volume yet. Upload PDFs below to get started.</InfoBox>
      )}

      {/* Upload controls */}
      <div className="space-y-2 pt-1">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md,.html"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !volumePath}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[12px] font-mono font-medium border border-dbx-gray-200 dark:border-dbx-gray-700 text-dbx-gray-500 dark:text-dbx-gray-400 hover:border-dbx-red dark:hover:border-[#FF6B5A] hover:text-dbx-red dark:hover:text-[#FF6B5A] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? 'uploading...' : 'upload local files'}
        </button>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-dbx-gray-400" />
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleUrlUpload() }}
              placeholder="paste URL..."
              disabled={urlUploading || !volumePath}
              className="w-full bg-white dark:bg-dbx-gray-900 font-mono text-[11px] text-dbx-gray-600 dark:text-dbx-gray-300 outline-none border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-lg pl-7 pr-3 py-2 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleUrlUpload}
            disabled={!urlInput.trim() || urlUploading || !volumePath}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-mono font-medium border border-dbx-gray-200 dark:border-dbx-gray-700 text-dbx-gray-500 dark:text-dbx-gray-400 hover:border-dbx-gray-400 dark:hover:border-dbx-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {urlUploading ? '...' : 'fetch'}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback.length > 0 && (
        <div className="space-y-0.5">
          {feedback.map((f, i) => (
            <div key={i} className={`text-[11px] font-mono ${
              f.text.startsWith('[+]') ? 'text-dbx-blue dark:text-dbx-green'
              : f.text.startsWith('[x]') ? 'text-dbx-error'
              : 'text-dbx-gray-400'
            }`}>{f.text}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Dynamic table list (fetched from API) ───────────────────────────────────

function SchemaTableList({ prefix }: { prefix: string }) {
  const [tables, setTables] = useState<string[]>([])
  useEffect(() => {
    fetch('/api/gen/tables')
      .then(r => r.json())
      .then(data => setTables((data.tables || []).map((t: { name: string }) => t.name)))
      .catch(() => setTables([]))
  }, [])
  if (tables.length === 0) return <div className="text-[12px] font-mono text-dbx-gray-400 py-1">no tables found</div>
  return (
    <>
      {tables.map(t => (
        <div key={t} className="flex items-center gap-2 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-dbx-blue dark:bg-dbx-green flex-shrink-0" />
          <span className="text-[12px] font-mono text-dbx-gray-600 dark:text-dbx-gray-300">{prefix ? `${prefix}.${t}` : t}</span>
        </div>
      ))}
    </>
  )
}

// ─── Dynamic routine list (functions + procedures from API) ─────────────────

function SchemaRoutineList({ prefix }: { prefix: string }) {
  const [routines, setRoutines] = useState<{ name: string; kind: string; source: string }[]>([])
  useEffect(() => {
    fetch('/api/gen/routines')
      .then(r => r.json())
      .then(data => setRoutines(data.routines || []))
      .catch(() => setRoutines([]))
  }, [])
  const functions = routines.filter(r => r.kind === 'function')
  const procedures = routines.filter(r => r.kind === 'procedure')
  if (routines.length === 0) return <div className="text-[12px] font-mono text-dbx-gray-400 py-1">no routines found</div>
  return (
    <>
      {functions.length > 0 && (
        <div className="mb-2">
          <div className="text-[9px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-1">functions ({functions.length})</div>
          {functions.map(r => (
            <div key={r.name} className="flex items-center gap-2 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-dbx-blue dark:bg-dbx-green flex-shrink-0" />
              <span className="text-[12px] font-mono text-dbx-gray-600 dark:text-dbx-gray-300">{prefix ? `${prefix}.${r.name}` : r.name}</span>
            </div>
          ))}
        </div>
      )}
      {procedures.length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-1">procedures ({procedures.length})</div>
          {procedures.map(r => (
            <div key={r.name} className="flex items-center gap-2 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-dbx-amber flex-shrink-0" />
              <span className="text-[12px] font-mono text-dbx-gray-600 dark:text-dbx-gray-300">{prefix ? `${prefix}.${r.name}` : r.name}</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ─── Prompt editor ───────────────────────────────────────────────────────────

interface PromptFile { name: string; content: string }

function PromptEditor({ onDone }: { onDone: () => void }) {
  const [files, setFiles] = useState<PromptFile[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)
  const [draft, setDraft] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch('/api/setup/prompts')
      .then(r => r.json())
      .then(data => {
        const f = (data.files || []) as PromptFile[]
        setFiles(f)
        if (f.length > 0) setDraft(f[0].content)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const selectFile = (i: number) => {
    setActive(i)
    setDraft(files[i].content)
    setDirty(false)
    setSaved(false)
  }

  const handleSave = async () => {
    if (!files[active]) return
    setSaving(true)
    try {
      await fetch('/api/setup/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: files[active].name, content: draft }),
      })
      const updated = [...files]
      updated[active] = { ...updated[active], content: draft }
      setFiles(updated)
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {}
    setSaving(false)
  }

  if (loading) return <div className="text-[13px] text-dbx-gray-400 font-mono animate-pulse p-2">loading prompts...</div>
  if (files.length === 0) return <div className="text-[13px] text-dbx-gray-400 font-mono p-2">no prompt files found in conf/prompt/</div>

  const lineCount = draft.split('\n').length

  return (
    <div className="flex flex-col h-full">
      {/* File tabs */}
      <div className="flex gap-1 px-1 pb-2 border-b border-dbx-gray-200 dark:border-dbx-gray-800 flex-shrink-0">
        {files.map((f, i) => (
          <button
            key={f.name}
            onClick={() => selectFile(i)}
            className={`text-[11px] font-mono px-2.5 py-1 rounded-md transition-all ${
              i === active
                ? 'bg-dbx-red/10 dark:bg-[#FF6B5A]/10 text-dbx-red dark:text-[#FF6B5A] border border-dbx-red/20 dark:border-[#FF6B5A]/20'
                : 'text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 border border-transparent'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 relative">
        <textarea
          ref={textRef}
          value={draft}
          onChange={e => { setDraft(e.target.value); setDirty(true); setSaved(false) }}
          spellCheck={false}
          className="w-full h-full resize-none bg-dbx-gray-950 text-dbx-gray-200 font-mono text-[12px] leading-relaxed p-3 outline-none border-none"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-dbx-gray-200 dark:border-dbx-gray-800 flex-shrink-0 bg-dbx-menu dark:bg-dbx-gray-900">
        <span className="text-[10px] font-mono text-dbx-gray-400 dark:text-dbx-gray-600">
          {lineCount} lines
          {saved && <span className="ml-2 text-dbx-blue dark:text-dbx-green animate-fade-in">[+] saved</span>}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`text-[11px] font-mono px-3 py-1 rounded-md transition-all ${
              dirty && !saving
                ? 'bg-dbx-red text-white hover:bg-dbx-red-dk'
                : 'bg-dbx-gray-100 dark:bg-dbx-gray-800 text-dbx-gray-300 dark:text-dbx-gray-600 cursor-not-allowed'
            }`}
          >
            {saving ? 'saving...' : 'save'}
          </button>
          <button
            onClick={onDone}
            className="text-[11px] font-mono px-3 py-1 rounded-md border border-dbx-gray-200 dark:border-dbx-gray-700 text-dbx-gray-400 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 transition-all"
          >
            done
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Prompt generator ────────────────────────────────────────────────────────

function PromptGenerator({ onDone }: { onDone: () => void }) {
  const [domain, setDomain] = useState('')
  const [tableSchemas, setTableSchemas] = useState<TableDef[]>([])
  const [generated, setGenerated] = useState<{ main_prompt: string; knowledge_base: string; user_prompt: string } | null>(null)
  const [trigger, setTrigger] = useState(0)
  const [mode, setMode] = useState<'generate' | 'save' | null>(null)
  const [preview, setPreview] = useState<'main' | 'kb' | 'user'>('main')
  const [saving, setSaving] = useState(false)

  // Load table schemas for context chips
  useEffect(() => {
    fetch('/api/gen/tables')
      .then(r => r.json())
      .then(data => {
        const tables = (data.tables || []).map((t: { name: string; columns?: { name: string; type: string }[] }) => ({
          name: t.name,
          columns: t.columns || [],
          row_count: 0,
          instructions: '',
        }))
        setTableSchemas(tables)
      })
      .catch(() => {})
  }, [])

  const handleGenerate = () => {
    setGenerated(null)
    setMode('generate')
    setTrigger(prev => prev + 1)
  }

  const handleResult = useCallback((data: unknown) => {
    const result = data as { main_prompt: string; knowledge_base: string; user_prompt: string }
    if (result.main_prompt) setGenerated(result)
  }, [])

  const handleDone = useCallback((ok: boolean) => {
    setMode(null)
    if (!ok) setGenerated(null)
  }, [])

  const handleSave = () => {
    if (!generated) return
    setSaving(true)
    setMode('save')
    setTrigger(prev => prev + 1)
  }

  const handleSaveResult = useCallback(() => {}, [])

  const handleSaveDone = useCallback((ok: boolean) => {
    setMode(null)
    setSaving(false)
    if (ok) onDone()
  }, [onDone])

  const previewContent = generated
    ? preview === 'main' ? generated.main_prompt
    : preview === 'kb' ? generated.knowledge_base
    : generated.user_prompt
    : ''

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2">
        {/* Domain input */}
        {!generated && (
          <div className="animate-fade-in">
            <Label>describe your agent domain</Label>
            <textarea
              value={domain}
              onChange={e => setDomain(e.target.value)}
              rows={3}
              disabled={mode === 'generate'}
              placeholder="e.g. car rental fleet management advisor that monitors vehicle availability, handles reservations, and tracks maintenance..."
              className="w-full bg-white dark:bg-dbx-gray-900 font-mono text-[12px] text-dbx-gray-600 dark:text-dbx-gray-300 outline-none border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-lg px-3 py-2.5 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors resize-none leading-relaxed disabled:opacity-50"
            />

            {/* Table context chips */}
            {tableSchemas.length > 0 && (
              <div className="mt-3 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 px-3 py-2.5">
                <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-1.5">available tables (auto-included as context)</div>
                <div className="flex flex-wrap gap-1.5">
                  {tableSchemas.map(t => (
                    <span key={t.name} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-dbx-blue-bg dark:bg-dbx-green-bg/10 text-dbx-blue dark:text-dbx-green border border-dbx-blue/20 dark:border-dbx-green/20">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Terminal */}
        {mode === 'generate' && (
          <div className="mt-3">
            <GenTerminal
              url="/api/gen/prompt-generate"
              body={{ domain, tableSchemas }}
              onResult={handleResult}
              onDone={handleDone}
              triggerKey={trigger}
            />
          </div>
        )}

        {mode === 'save' && generated && (
          <div className="mt-3">
            <GenTerminal
              url="/api/gen/prompt-save"
              body={generated}
              onResult={handleSaveResult}
              onDone={handleSaveDone}
              triggerKey={trigger}
            />
          </div>
        )}

        {/* Preview */}
        {generated && !mode && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <Label>generated prompts -- review before saving</Label>
            </div>

            {/* File tabs */}
            <div className="flex gap-1 mb-2">
              {([['main', 'main.prompt'], ['kb', 'knowledge.base'], ['user', 'user.prompt']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPreview(key as 'main' | 'kb' | 'user')}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-md transition-all ${
                    preview === key
                      ? 'bg-dbx-red/10 dark:bg-[#FF6B5A]/10 text-dbx-red dark:text-[#FF6B5A] border border-dbx-red/20 dark:border-[#FF6B5A]/20'
                      : 'text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 border border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Content preview */}
            <div className="rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-dbx-gray-950 overflow-hidden">
              <pre className="p-3 text-[11px] font-mono text-dbx-gray-300 leading-relaxed overflow-x-auto max-h-[350px] overflow-y-auto whitespace-pre-wrap">
                {previewContent}
              </pre>
            </div>
            <div className="text-[10px] font-mono text-dbx-gray-400 dark:text-dbx-gray-600 mt-1">
              {previewContent.split('\n').length} lines
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-dbx-gray-100 dark:border-dbx-gray-800 flex flex-col gap-1.5">
        {!generated && !mode && (
          <button
            onClick={handleGenerate}
            disabled={!domain.trim()}
            className={`w-full text-[14px] py-2.5 rounded-lg font-mono font-medium transition-all duration-200 ${
              domain.trim()
                ? 'bg-dbx-red text-white hover:bg-dbx-red-dk shadow-dbx-md hover:shadow-dbx-glow active:scale-[0.98]'
                : 'bg-dbx-gray-100 dark:bg-dbx-gray-800 text-dbx-gray-300 dark:text-dbx-gray-600 cursor-not-allowed'
            }`}
          >
            generate prompts
          </button>
        )}
        {generated && !mode && (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full text-[14px] py-2.5 rounded-lg font-mono font-medium bg-dbx-red text-white hover:bg-dbx-red-dk shadow-dbx-md hover:shadow-dbx-glow active:scale-[0.98] transition-all duration-200"
            >
              save to conf/prompt/
            </button>
            <button
              onClick={handleGenerate}
              className="w-full text-[13px] py-2 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 font-mono transition-all duration-150"
            >
              regenerate
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Editable schema field ────────────────────────────────────────────────────

function EditableSchemaField({ value, onSaved }: { value: string; onSaved?: () => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setDraft(value) }, [value])

  const isValid = draft.includes('.') && draft.split('.').every(p => p.trim().length > 0)

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    try {
      await fetch('/api/env', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ PROJECT_UNITY_CATALOG_SCHEMA: draft.trim() }),
      })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
      onSaved?.()
    } catch {}
    setSaving(false)
  }

  const handleCancel = () => {
    setDraft(value)
    setEditing(false)
  }

  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-1.5">catalog / schema</div>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
            placeholder="catalog.schema"
            className={`flex-1 bg-transparent font-mono text-[12px] outline-none border rounded px-2 py-1 transition-colors ${
              isValid
                ? 'text-dbx-gray-800 dark:text-dbx-gray-100 border-dbx-gray-300 dark:border-dbx-gray-600 focus:border-dbx-red dark:focus:border-[#FF6B5A]'
                : 'text-red-400 border-red-300 dark:border-red-700'
            }`}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
          />
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="text-[10px] font-mono text-emerald-500 hover:text-emerald-400 disabled:opacity-40 transition-colors"
          >
            {saving ? '...' : 'save'}
          </button>
          <button
            onClick={handleCancel}
            className="text-[10px] font-mono text-dbx-gray-400 hover:text-dbx-gray-300 transition-colors"
          >
            cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <span className={`text-[12px] font-mono ${value ? 'text-dbx-blue dark:text-dbx-green' : 'text-dbx-gray-400'}`}>
            {value || 'not set'}
          </span>
          {saved && <span className="text-[10px] font-mono text-emerald-400 animate-fade-in">[+] saved</span>}
          <button
            onClick={() => setEditing(true)}
            className="text-dbx-gray-400 dark:text-dbx-gray-600 hover:text-dbx-blue dark:hover:text-dbx-green transition-colors"
            title="Edit schema"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Atoms ─────────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-dbx-gray-400 dark:text-dbx-gray-500 uppercase tracking-widest mb-2 font-mono font-medium">{children}</div>
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-dbx-menu dark:bg-dbx-gray-800/50 border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-lg p-3 text-[13px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400 leading-relaxed mb-3">
      {children}
    </div>
  )
}

function Spinner({ label }: { label: string }) {
  return <div className="text-[13px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono animate-pulse">{label}</div>
}

function ErrMsg({ msg }: { msg: string }) {
  return <div className="text-[13px] text-dbx-error font-mono animate-fade-in">{msg}</div>
}

function Dot({ color }: { color: 'green' | 'gray' | 'amber' | 'red' }) {
  const cls = {
    green: 'bg-dbx-blue dark:bg-dbx-green shadow-[0_0_4px_rgba(46,125,209,0.4)] dark:shadow-[0_0_4px_rgba(0,169,114,0.4)]',
    gray:  'bg-dbx-gray-300 dark:bg-dbx-gray-600',
    amber: 'bg-dbx-amber shadow-[0_0_4px_rgba(230,138,0,0.3)]',
    red:   'bg-dbx-error shadow-[0_0_4px_rgba(226,75,74,0.4)]',
  }
  return <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cls[color]}`} />
}

function Tag({ color, children }: { color: 'green' | 'purple'; children: React.ReactNode }) {
  const cls = color === 'green'
    ? 'bg-dbx-blue-bg dark:bg-dbx-green-bg/10 text-dbx-blue-dk dark:text-dbx-green border border-dbx-blue/20 dark:border-dbx-green/20'
    : 'bg-dbx-red-bg dark:bg-dbx-red-bg-dk text-dbx-red dark:text-[#FF6B5A] border border-dbx-red/20'
  return <span className={`text-[10px] rounded-full px-2 py-0.5 font-mono font-medium ${cls}`}>{children}</span>
}

function PickRow({ active, disabled = false, onClick, children }: {
  active: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border mb-1.5 text-left transition-all duration-150
        ${active
          ? 'border-dbx-red dark:border-[#FF6B5A] bg-dbx-red-bg dark:bg-dbx-red-bg-dk shadow-dbx'
          : disabled
            ? 'border-dbx-gray-100 dark:border-dbx-gray-800/50 opacity-40 cursor-not-allowed bg-white dark:bg-dbx-gray-900'
            : 'border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 hover:border-dbx-red-lt dark:hover:border-dbx-gray-600 hover:shadow-node'}
      `}
    >
      {children}
    </button>
  )
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-[14px] font-mono bg-white dark:bg-dbx-gray-900 border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-lg px-3 py-2.5 outline-none focus:border-dbx-red focus:shadow-dbx dark:focus:border-[#FF6B5A] text-dbx-gray-800 dark:text-dbx-gray-100 placeholder:text-dbx-gray-300 dark:placeholder:text-dbx-gray-600 transition-all duration-150"
    />
  )
}

// ─── Terminal ──────────────────────────────────────────────────────────────────

function Terminal({ lines, showCopy = true }: { lines: ExecLine[]; showCopy?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight }, [lines])

  function color(text: string, stream: string) {
    if (stream === 'err' && !text.startsWith('[+]')) return 'text-dbx-amber'
    if (text.startsWith('[+]') || text.startsWith('\u2713')) return 'text-dbx-blue dark:text-dbx-green'
    if (text.startsWith('[x]') || text.startsWith('\u2717')) return 'text-dbx-error'
    if (text.startsWith('[~]') || text.startsWith('\u25b8') || text.startsWith('...')) return 'text-dbx-amber'
    return 'text-dbx-gray-400'
  }

  const copyAll = () => {
    const text = lines.map(l => l.text.replace(/\x1b\[[0-9;]*m/g, '').trimEnd()).join('\n')
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="relative">
      {showCopy && lines.length > 0 && (
        <button onClick={copyAll} className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-dbx-gray-800/80 hover:bg-dbx-gray-700 text-dbx-gray-500 hover:text-dbx-gray-300 transition-colors" title="Copy log">
          {copied ? (
            <svg className="w-3.5 h-3.5 text-dbx-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          )}
        </button>
      )}
      <div ref={ref} className="bg-dbx-gray-950 rounded-lg p-3 font-mono text-[13px] leading-relaxed h-[280px] overflow-y-auto border border-dbx-gray-800/50 shadow-inner">
        {lines.length === 0 && <div className="text-dbx-gray-600 animate-pulse">waiting for output...</div>}
        {lines.map((l, i) => {
          const clean = l.text.replace(/\x1b\[[0-9;]*m/g, '')
          return <div key={i} className={`animate-fade-in ${color(clean.trim(), l.stream)}`}>{clean.trimEnd()}</div>
        })}
      </div>
    </div>
  )
}

// ─── Current value helper ──────────────────────────────────────────────────────

function currentValueLabel(stepId: StepId, values: Record<string, string>): string {
  const v = values
  switch (stepId) {
    case 'host':      return v.DATABRICKS_HOST?.replace('https://', '') || ''
    case 'warehouse': return v.DATABRICKS_WAREHOUSE_ID || ''
    case 'schema':    return v.PROJECT_UNITY_CATALOG_SCHEMA || ''
    case 'tables':    return v.TABLE_COUNT ? `${v.TABLE_COUNT} table(s)` : ''
    case 'functions': return v.ROUTINE_COUNT ? `${v.ROUTINE_COUNT} routine(s)` : ''
    case 'model':     return v.AGENT_MODEL_ENDPOINT?.replace('https://', '') || ''
    case 'prompt':    return v.PROMPT_FILES || 'conf/prompt/'
    case 'genie':     return ''
    case 'ka':        return ''
    case 'vs':        return v.PROJECT_VS_INDEX || ''
    case 'lakebase':  return v.LAKEBASE_INSTANCE_NAME || ''
    case 'mlflow':    return v.MLFLOW_EXPERIMENT_ID || ''
    case 'deploy':    return v.DBX_APP_NAME || ''
    default:          return ''
  }
}

// ─── Step key map (step -> primary env key for inline edit) ─────────────────

const STEP_KEY_MAP: Record<string, string> = {
  host: 'DATABRICKS_HOST',
  auth: 'DATABRICKS_TOKEN',
  warehouse: 'DATABRICKS_WAREHOUSE_ID',
  schema: 'PROJECT_UNITY_CATALOG_SCHEMA',
  model: 'AGENT_MODEL_ENDPOINT',
  vs: 'PROJECT_VS_INDEX',
  lakebase: 'LAKEBASE_INSTANCE_NAME',
  mlflow: 'MLFLOW_EXPERIMENT_ID',
  deploy: 'DBX_APP_NAME',
}

// ─── Inline editable value ──────────────────────────────────────────────────

function InlineEditable({ value, stepId, onSave, onClear }: {
  value: string
  stepId: string
  onSave: (val: string) => void
  onClear: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus() }, [editing])
  useEffect(() => { setDraft(value) }, [value])

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && draft.trim()) {
              // Validate host URL format for host step
              if (stepId === 'host' && !/^https?:\/\/.+\.(databricks\.com|databricks\.net|azuredatabricks\.net)/.test(draft.trim())) return
              onSave(draft.trim()); setEditing(false)
            }
            if (e.key === 'Escape') { setDraft(value); setEditing(false) }
          }}
          onBlur={() => { setDraft(value); setEditing(false) }}
          className="flex-1 text-[13px] font-mono px-1.5 py-0.5 rounded border border-dbx-blue/40 dark:border-dbx-green/40 bg-transparent text-dbx-blue dark:text-dbx-green outline-none"
        />
        {stepId === 'host' && editing && !/^https?:\/\/.+\.(databricks\.com|databricks\.net|azuredatabricks\.net)/.test(draft.trim()) && draft.trim().length > 5 && (
          <span className="text-[10px] text-dbx-amber ml-1 flex-shrink-0">must be a valid Databricks URL</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      {stepId === 'host' && value ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
          className="text-[13px] font-mono text-dbx-blue truncate hover:underline">
          {value}
        </a>
      ) : value ? (
        <span className="text-[13px] font-mono text-dbx-blue truncate">{value}</span>
      ) : (
        <button onClick={() => setEditing(true)} className="text-[13px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-blue dark:hover:text-dbx-green transition-colors">
          enter workspace url
        </button>
      )}
      {value && (
        <button onClick={() => { navigator.clipboard.writeText(value) }} className="flex-shrink-0 text-dbx-gray-300 dark:text-dbx-gray-600 hover:text-dbx-blue dark:hover:text-dbx-green transition-colors" title="copy">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      )}
      {STEP_KEY_MAP[stepId] && (
        <button onClick={() => setEditing(true)} className="flex-shrink-0 text-dbx-gray-300 dark:text-dbx-gray-600 hover:text-dbx-blue dark:hover:text-dbx-green transition-colors" title="edit">
          <Pencil className="w-3 h-3" />
        </button>
      )}
      {value && (
        <button onClick={onClear} className="flex-shrink-0 text-dbx-gray-300 dark:text-dbx-gray-600 hover:text-dbx-red transition-colors" title="clear">
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

// ─── Bridge auth panel ──────────────────────────────────────────────────────

function BridgeAuthPanel({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [nonce, setNonce] = useState<{ nonce_id: string; nonce: string; ws_default?: string } | null>(null)
  const [status, setStatus] = useState<'loading' | 'waiting' | 'connected' | 'error'>('loading')
  const [connInfo, setConnInfo] = useState<{ host: string; user: string; warning?: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch nonce on mount
  useEffect(() => {
    fetch('/api/auth/bridge-nonce')
      .then(r => r.json())
      .then((data: { nonce_id: string; nonce: string; ws_default?: string }) => {
        setNonce(data)
        setStatus('waiting')
      })
      .catch(() => setStatus('error'))
  }, [])

  // Poll for connection
  useEffect(() => {
    if (status !== 'waiting') return
    pollRef.current = setInterval(() => {
      fetch('/api/auth/bridge-status')
        .then(r => r.json())
        .then((data: { status: string; host?: string; user?: string; warning?: string }) => {
          if (data.status === 'connected') {
            setStatus('connected')
            setConnInfo({ host: data.host || '', user: data.user || '', warning: data.warning || '' })
            if (pollRef.current) clearInterval(pollRef.current)
            setTimeout(onDone, 1500)
          }
        })
        .catch(() => {})
    }, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [status, onDone])

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const command = nonce ? `curl -sL "${appUrl}/api/auth/bridge-script?nonce=${nonce.nonce_id}" | bash` : ''

  const copyCommand = () => {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2 animate-fade-in">
        {status === 'loading' && (
          <div className="text-sm text-dbx-gray-400 animate-pulse">Generating secure session...</div>
        )}

        {status === 'error' && (
          <div className="text-sm text-dbx-red">Failed to initialize bridge session. Try again.</div>
        )}

        {(status === 'waiting' || status === 'connected') && nonce && (
          <>
            <div className="text-[13px] font-semibold text-dbx-gray-700 dark:text-dbx-gray-200 mb-2">
              Connect to workspace
            </div>

            <div className="rounded-lg border border-dbx-amber/30 bg-dbx-amber/5 dark:bg-dbx-amber/10 px-3 py-2 mb-3">
              <div className="text-[11px] text-dbx-amber font-medium">A 7-day PAT will be created on the target workspace</div>
              <div className="text-[10px] text-dbx-gray-500 dark:text-dbx-gray-400 mt-0.5">Your browser will open for SSO authentication.</div>
            </div>

            {typeof window !== 'undefined' && window.location.hostname === 'localhost' ? (
              <>
                {/* Local mode: curl | bash */}
                <div className="text-[12px] text-dbx-gray-500 dark:text-dbx-gray-400 mb-1.5">
                  Run this in your terminal:
                </div>
                <div className="relative group">
                  <pre className="bg-dbx-gray-950 text-[11px] text-dbx-gray-300 p-3 rounded-lg overflow-x-auto font-mono leading-relaxed border border-dbx-gray-800/50">
                    {command}
                  </pre>
                  <button
                    onClick={copyCommand}
                    className="absolute top-1.5 right-1.5 text-[10px] px-2 py-0.5 rounded bg-dbx-gray-800 text-dbx-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? 'copied' : 'copy'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Deployed mode: curl from GitHub */}
                <div className="text-[12px] text-dbx-gray-500 dark:text-dbx-gray-400 mb-1.5">
                  Run this in your terminal:
                </div>
                <div className="relative group">
                  <pre className="bg-dbx-gray-950 text-[11px] text-dbx-gray-300 p-3 rounded-lg overflow-x-auto font-mono leading-relaxed border border-dbx-gray-800/50 whitespace-pre-wrap break-all">
                    {`bash <(curl -sL https://raw.githubusercontent.com/mehdi-dbx/brickforge/forge-saas-databricks/scripts/connect.sh) "${appUrl}" "${nonce.nonce}" "${nonce.nonce_id}" "${nonce.ws_default || ''}"`}
                  </pre>
                  <button
                    onClick={() => {
                      const cmd = `bash <(curl -sL https://raw.githubusercontent.com/mehdi-dbx/brickforge/forge-saas-databricks/scripts/connect.sh) "${appUrl}" "${nonce.nonce}" "${nonce.nonce_id}" "${nonce.ws_default || ''}"`
                      navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 2000)
                    }}
                    className="absolute top-1.5 right-1.5 text-[10px] px-2 py-0.5 rounded bg-dbx-gray-800 text-dbx-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? 'copied' : 'copy'}
                  </button>
                </div>
              </>
            )}

            {/* Status */}
            <div className="mt-5 flex items-center gap-2">
              {status === 'waiting' ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-dbx-amber animate-pulse" />
                  <span className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500">
                    Waiting for connection...
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-dbx-green" />
                  <span className="text-[12px] text-dbx-green font-medium">
                    Connected to {connInfo?.host}
                    {connInfo?.user ? ` as ${connInfo.user}` : ''}
                  </span>
                </>
              )}
            </div>

            {connInfo?.warning && (
              <div className="mt-3 rounded-lg border border-dbx-amber/30 bg-dbx-amber/5 dark:bg-dbx-amber/10 px-3 py-2">
                <div className="text-[11px] text-dbx-amber font-medium">Cross-cloud detected</div>
                <div className="text-[10px] text-dbx-gray-500 dark:text-dbx-gray-400 mt-0.5 leading-relaxed">{connInfo.warning}</div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="px-4 py-3 border-t border-dbx-gray-100 dark:border-dbx-gray-800">
        <button
          onClick={onBack}
          className="w-full text-[13px] py-2 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 hover:border-dbx-gray-300 dark:hover:border-dbx-gray-700 font-mono transition-all duration-150"
        >
          back
        </button>
      </div>
    </>
  )
}

// ─── Main drawer ───────────────────────────────────────────────────────────────

export function SetupDrawer({
  activeStep, phase, selectedChoice, execLines, currentValues,
  testCache, onTestResult,
  onSelectChoice, onContinue, onBack, onReconfigure, onExecDone, onRefresh, onNext,
  selectedInstanceKey, instances, forgeMode,
}: SetupDrawerProps) {
  const step      = SETUP_STEPS.find(s => s.id === activeStep)!

  // Hide CLI-dependent choices in forge/deployed mode
  const CLI_ACTIONS = new Set(['cfg-profile', 'cfg-new'])
  const DEPLOY_CLI_ACTIONS = new Set(['exec-deploy', 'exec-deploy-dry'])
  const filteredChoices = forgeMode
    ? step.choices.filter(c => !CLI_ACTIONS.has(c.action) && !DEPLOY_CLI_ACTIONS.has(c.action))
    : step.choices

  const choice    = selectedChoice !== null ? filteredChoices[selectedChoice] : null
  const keepLabel = currentValueLabel(activeStep, currentValues)

  const abortRef = useRef<AbortController | null>(null)
  const [lastExecOk, setLastExecOk] = useState(true)
  const [showPat, setShowPat] = useState(false)

  // Reset exec status when step changes
  useEffect(() => { setLastExecOk(true) }, [activeStep])

  // Wrap onExecDone to track success/failure for renderDone
  const wrappedExecDone = useCallback((ok: boolean) => {
    setLastExecOk(ok)
    onExecDone(ok)
  }, [onExecDone])

  const handleCancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    wrappedExecDone(false)
  }, [wrappedExecDone])

  const TESTABLE_STEPS: StepId[] = ['host', 'warehouse', 'schema', 'tables', 'functions', 'model', 'genie', 'ka', 'vs', 'lakebase', 'mlflow', 'deploy']
  const testState: TestResult = testCache[activeStep] ?? { status: 'idle', message: '' }
  const setTestState = useCallback((r: TestResult) => onTestResult(activeStep, r), [activeStep, onTestResult])

  // Auto-test on step activation — only if not already cached
  useEffect(() => {
    if (testCache[activeStep]) return // already have a result, skip
    if (keepLabel && TESTABLE_STEPS.includes(activeStep)) {
      const timer = setTimeout(() => handleTest(), 150)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep])

  const handleTest = useCallback(async () => {
    setTestState({ status: 'loading', message: '' })
    try {
      const r = await fetch(`/api/setup/test?step=${activeStep}`)
      const text = await r.text()
      let data: { ok: boolean; message: string }
      try {
        data = JSON.parse(text)
      } catch {
        data = { ok: false, message: r.status === 404 ? 'backend needs restart' : text.slice(0, 120).replace(/<[^>]+>/g, '').trim() || 'unexpected response' }
      }
      setTestState({ status: data.ok ? 'ok' : 'fail', message: data.message })
    } catch (e) {
      setTestState({ status: 'fail', message: String(e) })
    }
  }, [activeStep])

  const [selProfile, setSelProfile]     = useState('')
  const [selWhId, setSelWhId]           = useState('')
  const [selWhName, setSelWhName]       = useState('')
  const [selCatalog, setSelCatalog]     = useState('')
  const [catSchema, setCatSchema]       = useState('main')
  const [selGenieId, setSelGenieId]     = useState('')
  const [selGenieName, setSelGenieName] = useState('')
  const [manualVal, setManualVal]       = useState('')
  const [genieName, setGenieName]       = useState('')
  const [assetsSchema, setAssetsSchema] = useState('')
  const [kaDocsReady, setKaDocsReady]   = useState(false)
  const [mcpSlug, setMcpSlug]           = useState('')
  const [mcpHeader, setMcpHeader]       = useState('')
  const [apiMethod, setApiMethod]       = useState('GET')
  const [apiPath, setApiPath]           = useState('/')
  const [apiDesc, setApiDesc]           = useState('')
  const [apiParams, setApiParams]       = useState('')
  const [selLakebaseId, setSelLakebaseId] = useState('')
  const [instanceTest, setInstanceTest] = useState<TestResult>({ status: 'idle', message: '' })
  const [instanceTools, setInstanceTools] = useState<{ name: string; description: string }[] | null>(null)
  const [toolsLoading, setToolsLoading] = useState(false)
  const [featureKeyInput, setFeatureKeyInput] = useState('')
  const [featureKeySaving, setFeatureKeySaving] = useState(false)

  // Test a specific instance by env key
  const handleInstanceTest = useCallback(async (key: string) => {
    setInstanceTest({ status: 'loading', message: '' })
    try {
      const r = await fetch(`/api/setup/test?step=${activeStep}&key=${encodeURIComponent(key)}`)
      const text = await r.text()
      let data: { ok: boolean; message: string }
      try { data = JSON.parse(text) } catch { data = { ok: false, message: text.slice(0, 120) } }
      setInstanceTest({ status: data.ok ? 'ok' : 'fail', message: data.message })
    } catch (e) {
      setInstanceTest({ status: 'fail', message: String(e) })
    }
  }, [activeStep])

  // Auto-test instance on selection + fetch tools for MCP/A2A
  useEffect(() => {
    setInstanceTest({ status: 'idle', message: '' })
    setInstanceTools(null)
    if (selectedInstanceKey) {
      const timer = setTimeout(() => handleInstanceTest(selectedInstanceKey), 200)
      // Fetch tools for MCP/A2A instances
      if (['mcp', 'a2a'].includes(activeStep)) {
        setToolsLoading(true)
        fetch(`/api/setup/mcp-tools?key=${encodeURIComponent(selectedInstanceKey)}`)
          .then(r => r.json())
          .then(data => { if (data.tools) setInstanceTools(data.tools); })
          .catch(() => {})
          .finally(() => setToolsLoading(false))
      }
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstanceKey])

  useEffect(() => {
    setSelProfile(''); setSelWhId(''); setSelWhName('')
    setSelCatalog(''); setCatSchema('main')
    setSelGenieId(''); setSelGenieName('')
    setManualVal(''); setGenieName(''); setKaDocsReady(false)
    setMcpSlug(''); setMcpHeader('')
    setAssetsSchema(currentValues.PROJECT_UNITY_CATALOG_SCHEMA || '')
  }, [activeStep, selectedChoice, currentValues.PROJECT_UNITY_CATALOG_SCHEMA])

  // SSE runner
  useEffect(() => {
    if (phase !== 'execute' || !choice) return
    let action = choice.action
    const params: Record<string, string> = {}

    if (action === 'cfg-warehouse' && selWhId)    { action = 'save-warehouse'; Object.assign(params, { id: selWhId, name: selWhName }) }
    if (action === 'cfg-catalog'   && selCatalog) { action = 'save-schema';    Object.assign(params, { catalog: selCatalog, schema: catSchema || 'main' }) }
    if (action === 'cfg-genie'     && selGenieId) { action = 'save-genie';     Object.assign(params, { id: selGenieId, name: selGenieName }) }
    if (action === 'cfg-lakebase'  && selLakebaseId) { action = 'save-lakebase'; Object.assign(params, { name: selLakebaseId }) }
    if (action === 'exec-genie'    && genieName)  { Object.assign(params, { name: genieName }) }
    // Host: cfg-profile saves host from selected profile
    if (action === 'cfg-profile' && activeStep === 'host' && selProfile) { action = 'save-host'; Object.assign(params, { profile: selProfile }) }
    // Model: cfg-profile generates PAT + saves endpoint from selected profile
    if (action === 'cfg-profile' && activeStep === 'model' && selProfile) { action = 'save-model-profile'; Object.assign(params, { profile: selProfile }) }
    // cfg-new: run databricks auth login with provided host/profile
    if (action === 'cfg-new' && manualVal) { action = 'exec-auth-login'; Object.assign(params, { host: manualVal, profile: genieName || '' }) }
    // Manual: host step saves token (host already set via pen icon)
    if (action === 'manual' && activeStep === 'host' && manualVal) {
      action = 'save-manual'
      Object.assign(params, { key: 'DATABRICKS_TOKEN', value: manualVal.trim() })
    }
    // Manual: save typed value directly to env for other steps
    else if (action === 'manual' && manualVal && activeStep !== 'mcp' && activeStep !== 'a2a') {
      const envKey = STEP_KEY_MAP[activeStep]
      if (envKey) {
        action = 'save-manual'
        Object.assign(params, { key: envKey, value: manualVal.trim() })
      }
    }
    // Deploy: cfg-deploy-name saves app name to .env.local
    if (action === 'cfg-deploy-name' && manualVal) { action = 'save-deploy-name'; Object.assign(params, { name: manualVal.trim() }) }
    // API: cfg-api-uc or cfg-api-direct saves API config to .env.local
    if (action === 'cfg-api-uc' && mcpSlug && manualVal) {
      const slug = mcpSlug.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_')
      action = 'save-api'
      Object.assign(params, { slug, type: 'uc', conn: manualVal.trim(), method: apiMethod || 'GET', path: apiPath || '/', desc: apiDesc, apiParams, header: '' })
    }
    if (action === 'cfg-api-direct' && mcpSlug && manualVal) {
      const slug = mcpSlug.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_')
      action = 'save-api'
      Object.assign(params, { slug, type: 'direct', url: manualVal.trim(), method: apiMethod || 'GET', path: apiPath || '/', desc: apiDesc, apiParams, header: mcpHeader })
    }
    // KA: cfg-ka configure phase uploads docs, execute phase creates the KA endpoint
    if (action === 'cfg-ka') { action = 'exec-ka' }
    // MCP/A2A: manual action saves slug + url + optional header
    if (action === 'manual' && (activeStep === 'mcp' || activeStep === 'a2a') && mcpSlug && manualVal) {
      const prefix = activeStep === 'mcp' ? 'PROJECT_MCP_' : 'PROJECT_A2A_'
      action = 'save-multi-instance'
      Object.assign(params, { prefix, slug: mcpSlug.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_'), url: manualVal.trim(), header: mcpHeader.trim() })
    }
    // Create all assets: pass confirmed schema so backend saves it first
    if (action === 'exec-assets' && assetsSchema) { Object.assign(params, { schema: assetsSchema.trim() }) }

    let aborted = false
    const controller = new AbortController()
    abortRef.current = controller
    async function run() {
      try {
        const resp = await fetch('/api/setup/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, params }),
          signal: controller.signal,
        })
        if (!resp.body) { wrappedExecDone(false); return }
        const reader  = resp.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        while (true) {
          if (aborted) { reader.cancel(); break }
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
            if (evtType === 'line')      window.dispatchEvent(new CustomEvent('exec-line', { detail: parsed }))
            else if (evtType === 'done' && !aborted) wrappedExecDone(parsed.ok)
          }
        }
      } catch (e) {
        if (controller.signal.aborted) return  // user cancelled
        console.error('[exec]', e)
        if (!aborted) wrappedExecDone(false)
      }
    }
    run()
    return () => { aborted = true; controller.abort() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const PHASES = ['choose', 'configure', 'execute', 'done'] as const
  const phaseIdx = PHASES.indexOf(phase)

  // ── Choose ─────────────────────────────────────────────────────────────────
  // Steps that require host to be configured first
  const NEEDS_HOST = new Set(['warehouse', 'schema', 'tables', 'functions', 'model', 'genie', 'ka', 'vs', 'lakebase', 'mlflow', 'grants', 'deploy', 'git'])
  const hostMissing = NEEDS_HOST.has(activeStep) && !currentValues.DATABRICKS_HOST

  function renderChoose() {
    if (hostMissing) {
      return (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-[13px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono">configure databricks host first</div>
          </div>
        </div>
      )
    }

    return (
      <>
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2">
          {filteredChoices.map((c, i) => (
              <button
                key={i}
                onClick={() => onSelectChoice(i)}
                onDoubleClick={() => { onSelectChoice(i); setTimeout(onContinue, 0) }}
                className={`
                  w-full flex items-start gap-3 px-3.5 py-3 rounded-lg border mb-2 text-left transition-all duration-150 animate-slide-up
                  ${selectedChoice === i
                    ? 'border-dbx-red dark:border-[#FF6B5A] bg-dbx-red-bg dark:bg-dbx-red-bg-dk shadow-dbx'
                    : 'border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 hover:border-dbx-red-lt dark:hover:border-dbx-gray-700 hover:shadow-node hover:bg-dbx-gray-50/50 dark:hover:bg-dbx-gray-800/50'}
                `}
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
              >
                <span className={`text-[12px] font-mono mt-0.5 min-w-[18px] font-medium ${selectedChoice === i ? 'text-dbx-red dark:text-[#FF6B5A]' : 'text-dbx-gray-300 dark:text-dbx-gray-600'}`}>
                  {i + 1}
                </span>
                <div>
                  <div className="text-[13px] font-medium text-dbx-gray-800 dark:text-dbx-gray-100 leading-tight">{c.title}</div>
                  <div className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 leading-snug mt-0.5">{c.desc}</div>
                </div>
              </button>
          ))}

          {/* Help box */}
          <div className="mt-3 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-dbx-menu dark:bg-dbx-gray-800/30 px-4 py-3">
            <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-1.5">about this step</div>
            <div className="text-[12px] leading-relaxed text-dbx-gray-500 dark:text-dbx-gray-400">{step.help}</div>
            {activeStep === 'tables' && (
              <>
                <div className="mt-3 pt-2.5 border-t border-dbx-gray-200 dark:border-dbx-gray-700">
                  <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-1.5">tables</div>
                  <SchemaTableList prefix={currentValues.PROJECT_UNITY_CATALOG_SCHEMA || ''} />
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('switch-view', { detail: 'data' }))}
                  className="mt-2.5 text-[12px] font-mono text-dbx-blue dark:text-dbx-green hover:underline"
                >
                  view table schemas →
                </button>
              </>
            )}
            {activeStep === 'functions' && (
              <div className="mt-3 pt-2.5 border-t border-dbx-gray-200 dark:border-dbx-gray-700">
                <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-1.5">routines</div>
                <SchemaRoutineList prefix={currentValues.PROJECT_UNITY_CATALOG_SCHEMA || ''} />
              </div>
            )}
            {activeStep === 'ka' && (
              <div className="mt-3 pt-2.5 border-t border-dbx-gray-200 dark:border-dbx-gray-700">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('switch-view', { detail: 'ka' }))}
                  className="text-[12px] font-mono text-dbx-blue dark:text-dbx-green hover:underline"
                >
                  manage documents {'->'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="px-4 py-3 border-t border-dbx-gray-100 dark:border-dbx-gray-800">
          <button
            onClick={onContinue}
            disabled={selectedChoice === null}
            className={`
              w-full text-[14px] py-2.5 rounded-lg font-mono font-medium transition-all duration-200
              ${selectedChoice !== null
                ? 'bg-dbx-red text-white hover:bg-dbx-red-dk shadow-dbx-md hover:shadow-dbx-glow active:scale-[0.98]'
                : 'bg-dbx-gray-100 dark:bg-dbx-gray-800 text-dbx-gray-300 dark:text-dbx-gray-600 cursor-not-allowed'}
            `}
          >
            continue →
          </button>
        </div>
      </>
    )
  }

  // ── Configure ──────────────────────────────────────────────────────────────
  function renderConfigure() {
    if (!choice) return null
    const action = choice.action

    const validSchema = /^\w+\.\w+$/.test(assetsSchema.trim())

    function canRun() {
      if (action === 'cfg-profile')   return !!selProfile
      if (action === 'cfg-warehouse') return !!selWhId
      if (action === 'cfg-catalog')   return !!selCatalog && !!catSchema
      if (action === 'cfg-genie')     return !!selGenieId
      if (action === 'cfg-lakebase')  return !!selLakebaseId
      if (action === 'exec-genie')    return !!genieName
      if (action === 'cfg-new')         return !!manualVal.trim()
      if (action === 'cfg-deploy-name') return !!manualVal.trim()
      if (action === 'exec-assets')     return validSchema
      if (action === 'cfg-ka')        return kaDocsReady
      if (action === 'cfg-api-uc')     return !!mcpSlug.trim() && !!manualVal.trim()
      if (action === 'cfg-api-direct') return !!mcpSlug.trim() && !!manualVal.trim()
      if (action === 'manual' && (activeStep === 'mcp' || activeStep === 'a2a')) return !!mcpSlug.trim() && !!manualVal.trim()
      if (action === 'manual' && activeStep === 'host') return /^dapi[a-f0-9]{32,}$/.test(manualVal.trim())
      if (action === 'manual' && activeStep === 'schema') return /^\w+\.\w+$/.test(manualVal.trim())
      if (action === 'manual')        return !!manualVal.trim()
      return true
    }

    let body: React.ReactNode
    if (action === 'cfg-profile')
      body = <ProfileList selected={selProfile} onSelect={setSelProfile} />
    else if (action === 'cfg-warehouse')
      body = <WarehouseList selected={selWhId} onSelect={(id, name) => { setSelWhId(id); setSelWhName(name) }} />
    else if (action === 'cfg-catalog')
      body = <CatalogPicker catalog={selCatalog} schema={catSchema} onCatalog={setSelCatalog} onSchema={setCatSchema} />
    else if (action === 'cfg-genie')
      body = <GenieList selected={selGenieId} onSelect={(id, name) => { setSelGenieId(id); setSelGenieName(name) }} />
    else if (action === 'cfg-lakebase')
      body = <LakebaseList selected={selLakebaseId} onSelect={setSelLakebaseId} />
    else if (action === 'exec-genie')
      body = (<><Label>genie room name</Label><Input value={genieName} onChange={setGenieName} placeholder="Checkin Metrics" /></>)
    else if (action === 'cfg-api-uc')
      body = (<>
        <Label>API name</Label>
        <Input value={mcpSlug} onChange={setMcpSlug} placeholder="weather" />
        <div className="mt-3"><Label>UC connection name</Label></div>
        <Input value={manualVal} onChange={setManualVal} placeholder="my-weather-api" />
        <div className="mt-3"><Label>method</Label></div>
        <Input value={apiMethod} onChange={setApiMethod} placeholder="GET" />
        <div className="mt-3"><Label>path</Label></div>
        <Input value={apiPath} onChange={setApiPath} placeholder="/v1/current" />
        <div className="mt-3"><Label>description</Label></div>
        <Input value={apiDesc} onChange={setApiDesc} placeholder="Get current weather for a city" />
        <div className="mt-3"><Label>params (optional, comma-separated name:type)</Label></div>
        <Input value={apiParams} onChange={setApiParams} placeholder="city:str,units:str" />
        <div className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 mt-2 font-mono">
          saves PROJECT_API_{mcpSlug ? mcpSlug.toUpperCase().replace(/[^A-Z0-9]/g, '_') : '<NAME>'}_CONN to .env.local
        </div>
      </>)
    else if (action === 'cfg-api-direct')
      body = (<>
        <Label>API name</Label>
        <Input value={mcpSlug} onChange={setMcpSlug} placeholder="weather" />
        <div className="mt-3"><Label>base URL</Label></div>
        <Input value={manualVal} onChange={setManualVal} placeholder="https://api.weather.com" />
        <div className="mt-3"><Label>method</Label></div>
        <Input value={apiMethod} onChange={setApiMethod} placeholder="GET" />
        <div className="mt-3"><Label>path</Label></div>
        <Input value={apiPath} onChange={setApiPath} placeholder="/v1/current" />
        <div className="mt-3"><Label>description</Label></div>
        <Input value={apiDesc} onChange={setApiDesc} placeholder="Get current weather for a city" />
        <div className="mt-3"><Label>params (optional, comma-separated name:type)</Label></div>
        <Input value={apiParams} onChange={setApiParams} placeholder="city:str,units:str" />
        <div className="mt-3"><Label>auth header (optional)</Label></div>
        <Input value={mcpHeader} onChange={setMcpHeader} placeholder="X-API-Key:sk-abc123" />
        <div className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 mt-2 font-mono">
          saves PROJECT_API_{mcpSlug ? mcpSlug.toUpperCase().replace(/[^A-Z0-9]/g, '_') : '<NAME>'}_URL to .env.local
        </div>
      </>)
    else if (action === 'manual' && (activeStep === 'mcp' || activeStep === 'a2a'))
      body = (<>
        <Label>name</Label>
        <Input value={mcpSlug} onChange={setMcpSlug} placeholder={activeStep === 'mcp' ? 'weather' : 'planner'} />
        <div className="mt-3"><Label>{activeStep === 'mcp' ? 'server URL' : 'agent URL'}</Label></div>
        <Input value={manualVal} onChange={setManualVal} placeholder="https://..." />
        <div className="mt-3"><Label>auth header (optional)</Label></div>
        <Input value={mcpHeader} onChange={setMcpHeader} placeholder="Authorization:Bearer sk-..." />
        <div className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 mt-2 font-mono">
          saves as {activeStep === 'mcp' ? 'PROJECT_MCP_' : 'PROJECT_A2A_'}{mcpSlug ? mcpSlug.toUpperCase().replace(/[^A-Z0-9]/g, '_') : '<NAME>'} in .env.local
        </div>
      </>)
    else if (action === 'manual' && activeStep === 'host') {
      const wsHost = currentValues.DATABRICKS_HOST || ''
      const hostValid = /^https?:\/\/.+\.(databricks\.com|databricks\.net|azuredatabricks\.net)/.test(wsHost)
      const detectCl = (h: string) => h.includes('.azuredatabricks.net') ? 'Azure' : h.includes('.gcp.databricks.com') || h.includes('.gcp.databricksapps.com') ? 'GCP' : h.includes('.cloud.databricks.com') || h.includes('.aws.databricksapps.com') ? 'AWS' : null
      const appHost = typeof window !== 'undefined' ? window.location.hostname : ''
      const appCloud = detectCl(appHost)
      const targetCloud = detectCl(wsHost)
      const crossCloud = appCloud && targetCloud && appCloud !== targetCloud
      const patValid = /^dapi[a-f0-9]{32,}$/.test(manualVal.trim())
      const patStarted = manualVal.trim().length > 0
      body = (<>
        <Label>token (PAT)</Label>
        <div className="relative">
          <input
            type={showPat ? 'text' : 'password'}
            value={manualVal}
            onChange={e => setManualVal(e.target.value)}
            placeholder="dapi..."
            className="w-full text-[14px] font-mono bg-white dark:bg-dbx-gray-900 border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-lg px-3 py-2.5 pr-10 outline-none focus:border-dbx-red focus:shadow-dbx dark:focus:border-[#FF6B5A] text-dbx-gray-800 dark:text-dbx-gray-100 placeholder:text-dbx-gray-300 dark:placeholder:text-dbx-gray-600 transition-all duration-150"
          />
          <button
            type="button"
            onClick={() => setShowPat(!showPat)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dbx-gray-400 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 transition-colors"
            title={showPat ? 'hide token' : 'show token'}
          >
            {showPat ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            )}
          </button>
        </div>
        <div className="mt-1 text-[11px] font-mono">
          {patStarted && patValid && <span className="text-dbx-green">valid PAT</span>}
          {patStarted && !patValid && <span className="text-dbx-gray-500">token should start with <span className="text-dbx-blue dark:text-dbx-green">dapi</span> followed by 32+ hex characters</span>}
        </div>
        {hostValid && (
          <div className="mt-3 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-dbx-menu dark:bg-dbx-gray-800/30 px-3 py-2.5">
            <div className="text-[11px] font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 uppercase tracking-wider mb-1.5">how to generate a PAT</div>
            <div className="text-[12px] text-dbx-gray-500 dark:text-dbx-gray-400 leading-relaxed">
              1. Open{' '}
              <a
                href={`${wsHost.replace(/\/+$/, '')}/#setting/account/token`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-dbx-blue dark:text-dbx-green hover:underline font-medium"
              >
                {wsHost.replace('https://', '').replace(/\/+$/, '')} token settings
              </a>
              <br/>
              2. Click <strong>Generate new token</strong><br/>
              3. Name: <span className="font-mono text-dbx-blue dark:text-dbx-green">brickforge</span>, Lifetime: <strong>7 days</strong><br/>
              4. Scope: select <strong>All APIs</strong><br/>
              5. Copy the <span className="font-mono">dapi...</span> token and paste above
            </div>
          </div>
        )}
        {!hostValid && (
          <div className="mt-2 text-[11px] text-dbx-amber font-mono">
            Set a valid workspace URL first (use the pencil icon above)
          </div>
        )}
        {crossCloud && (
          <div className="mt-3 rounded-lg border border-dbx-amber/30 bg-dbx-amber/5 dark:bg-dbx-amber/10 px-3 py-2">
            <div className="text-[11px] text-dbx-amber font-medium">Cross-cloud detected</div>
            <div className="text-[10px] text-dbx-gray-500 dark:text-dbx-gray-400 mt-0.5 leading-relaxed">
              Target workspace ({targetCloud}) is on a different cloud than this Setup App ({appCloud}). API calls may be blocked by IP Access Lists. For best results, use the Setup App locally or deploy it on the same cloud.
            </div>
          </div>
        )}
      </>)
    }
    else if (action === 'manual' && activeStep === 'schema')
      body = (<>
        <Label>catalog . schema</Label>
        <div className="flex items-center gap-0">
          <input
            value={manualVal.split('.')[0] || ''}
            onChange={e => {
              const schema = manualVal.split('.')[1] || ''
              setManualVal(e.target.value + (schema ? '.' + schema : ''))
            }}
            placeholder="catalog"
            className="flex-1 text-[13px] font-mono px-3 py-2 rounded-l-lg border border-r-0 border-dbx-gray-200 dark:border-dbx-gray-700 bg-white dark:bg-dbx-gray-900 text-dbx-gray-800 dark:text-dbx-gray-200 outline-none focus:border-dbx-blue dark:focus:border-dbx-green"
          />
          <span className="text-[18px] font-bold text-dbx-gray-400 dark:text-dbx-gray-500 px-1.5 py-2 border-t border-b border-dbx-gray-200 dark:border-dbx-gray-700 bg-dbx-gray-50 dark:bg-dbx-gray-800">.</span>
          <input
            value={manualVal.split('.')[1] || ''}
            onChange={e => {
              const catalog = manualVal.split('.')[0] || ''
              setManualVal(catalog + '.' + e.target.value)
            }}
            placeholder="schema"
            className="flex-1 text-[13px] font-mono px-3 py-2 rounded-r-lg border border-l-0 border-dbx-gray-200 dark:border-dbx-gray-700 bg-white dark:bg-dbx-gray-900 text-dbx-gray-800 dark:text-dbx-gray-200 outline-none focus:border-dbx-blue dark:focus:border-dbx-green"
          />
        </div>
        <div className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 mt-2 font-mono">
          saves as PROJECT_UNITY_CATALOG_SCHEMA={manualVal || 'catalog.schema'}
        </div>
      </>)
    else if (action === 'manual')
      body = (<><Label>value</Label><Input value={manualVal} onChange={setManualVal} placeholder="paste value…" /><div className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 mt-2 font-mono">writes directly to .env.local</div></>)
    else if (action === 'cfg-new')
      body = (<><Label>workspace url</Label><Input value={manualVal} onChange={setManualVal} placeholder="https://....cloud.databricks.com" /><div className="mt-3"><Label>profile name (optional)</Label><Input value={genieName} onChange={setGenieName} placeholder="my-workspace" /></div><InfoBox>Will run `databricks auth login` automatically and open the browser for OAuth.</InfoBox></>)
    else if (action === 'cfg-deploy-name')
      body = (<><Label>app name</Label><Input value={manualVal} onChange={setManualVal} placeholder="my-agent-app" /><div className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 mt-2 font-mono">sets DBX_APP_NAME in .env.local -- used as the Databricks App name for deployment</div></>)
    else if (action === 'cfg-prompt')
      return (
        <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
          <PromptEditor onDone={() => { wrappedExecDone(true) }} />
        </div>
      )
    else if (action === 'cfg-prompt-gen')
      return (
        <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
          <PromptGenerator onDone={() => { wrappedExecDone(true) }} />
        </div>
      )
    else if (action === 'cfg-ka')
      body = <KaDocsPicker onReady={setKaDocsReady} />
    else if (action === 'cfg-grants')
      body = <InfoBox>Run the grant script to apply UC table, routine, and warehouse permissions to the app service principal.</InfoBox>
    else if (action === 'forge-bridge')
      return <BridgeAuthPanel onDone={() => { onRefresh(); wrappedExecDone(true) }} onBack={onBack} />
    else
      body = <InfoBox>This action will execute automatically.</InfoBox>

    return (
      <>
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2 animate-fade-in">{body}</div>
        <div className="px-4 py-3 border-t border-dbx-gray-100 dark:border-dbx-gray-800 flex flex-col gap-1.5">
          <button
            onClick={onContinue}
            disabled={!canRun()}
            className={`
              w-full text-[14px] py-2.5 rounded-lg font-mono font-medium transition-all duration-200
              ${canRun()
                ? 'bg-dbx-red text-white hover:bg-dbx-red-dk shadow-dbx-md hover:shadow-dbx-glow active:scale-[0.98]'
                : 'bg-dbx-gray-100 dark:bg-dbx-gray-800 text-dbx-gray-300 dark:text-dbx-gray-600 cursor-not-allowed'}
            `}
          >
            {action === 'cfg-ka' ? 'provision KA endpoint →' : 'run →'}
          </button>
          <button
            onClick={onBack}
            className="w-full text-[13px] py-2 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 hover:border-dbx-gray-300 dark:hover:border-dbx-gray-700 font-mono transition-all duration-150"
          >
            back
          </button>
        </div>
      </>
    )
  }

  // ── Execute ────────────────────────────────────────────────────────────────
  function renderExecute() {
    return (
      <>
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2 animate-fade-in">
          <Terminal lines={execLines} />
        </div>
        <div className="px-4 py-3 border-t border-dbx-gray-100 dark:border-dbx-gray-800 flex gap-2">
          <div className="flex-1 relative">
            <button disabled className="w-full text-[14px] py-2.5 rounded-lg bg-dbx-gray-100 dark:bg-dbx-gray-800 text-dbx-gray-300 dark:text-dbx-gray-600 cursor-not-allowed font-mono relative overflow-hidden">
              <span className="relative z-10">running…</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dbx-red/5 to-transparent animate-pulse" />
            </button>
          </div>
          <button
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-lg text-[13px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 border border-dbx-gray-200 dark:border-dbx-gray-700 hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 transition-colors"
          >
            cancel
          </button>
        </div>
      </>
    )
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  function renderDone() {
    const failed = !lastExecOk

    return (
      <>
        <div className="flex-1 flex flex-col px-4 pt-4 pb-2 overflow-y-auto">
          <div className="flex flex-col items-center mb-3 animate-pop">
            {failed ? (
              <>
                <div className="w-12 h-12 rounded-full bg-dbx-error/10 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(226,75,74,0.2)]">
                  <span className="text-[24px] text-dbx-error leading-none">&#10007;</span>
                </div>
                <div className="text-[14px] font-semibold text-dbx-error">failed</div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-dbx-blue-bg dark:bg-dbx-green-bg/10 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(46,125,209,0.2)] dark:shadow-[0_0_20px_rgba(0,169,114,0.2)]">
                  <span className="text-[24px] text-dbx-blue dark:text-dbx-green leading-none">&#10003;</span>
                </div>
                <div className="text-[14px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100">configured</div>
              </>
            )}
          </div>
          {execLines.length > 0 && <Terminal lines={execLines} />}
        </div>
        <div className="px-4 py-3 border-t border-dbx-gray-100 dark:border-dbx-gray-800 flex flex-col gap-2">
          {onNext && (
            <button
              onClick={onNext}
              className="w-full text-[14px] py-2.5 rounded-lg bg-dbx-blue dark:bg-dbx-green text-white font-mono font-medium hover:bg-dbx-blue-dk dark:hover:bg-dbx-green-dk shadow-[0_2px_8px_rgba(46,125,209,0.25)] dark:shadow-[0_2px_8px_rgba(0,169,114,0.25)] hover:shadow-[0_0_16px_rgba(46,125,209,0.3)] dark:hover:shadow-[0_0_16px_rgba(0,169,114,0.3)] transition-all duration-200 active:scale-[0.98]"
            >
              next &#8594;
            </button>
          )}
          <button
            onClick={onReconfigure}
            className="w-full text-[13px] py-2 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-red hover:border-dbx-red-lt font-mono transition-all duration-150"
          >
            reconfigure
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dbx-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dbx-gray-100 dark:border-dbx-gray-800 flex-shrink-0 bg-dbx-menu dark:bg-dbx-gray-900">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[11px] text-dbx-gray-400 dark:text-dbx-gray-500 uppercase tracking-widest font-mono font-medium">{step.label}</div>
          {phase !== 'choose' && (
            <button
              onClick={onBack}
              className="text-[11px] text-dbx-gray-400 dark:text-dbx-gray-500 border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-md px-2 py-0.5 hover:text-dbx-gray-600 dark:hover:text-dbx-gray-300 font-mono transition-all duration-150 hover:shadow-node"
            >
              ← back
            </button>
          )}
        </div>
        <div className="text-[16px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 font-mono">{step.title}</div>
        {(keepLabel || TESTABLE_STEPS.includes(activeStep) || activeStep === 'host') && (
          <>
            {/* Line 1: current value — editable for schema step, read-only for others */}
            <div className="flex items-center gap-2 mt-1.5">
              {activeStep === 'schema' ? (
                <EditableSchemaField value={currentValues.PROJECT_UNITY_CATALOG_SCHEMA || ''} onSaved={() => { onRefresh(); setTestState({ status: 'idle', message: '' }) }} />
              ) : testState.status === 'loading'
                ? <div className="text-[13px] font-mono text-dbx-blue dark:text-dbx-green truncate flex-1 animate-pulse">verifying…</div>
                : testState.status === 'fail'
                  ? <div className="text-[13px] font-mono text-dbx-amber truncate flex-1">please configure {step.label}</div>
                  : (keepLabel || activeStep === 'host')
                    ? <InlineEditable
                        value={keepLabel}
                        stepId={activeStep}
                        onSave={async (val) => {
                          await fetch('/api/env', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ [STEP_KEY_MAP[activeStep] || '']: val }),
                          })
                          onRefresh()
                        }}
                        onClear={() => {
                          fetch('/api/setup/clear-step', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ step: activeStep }),
                          }).then(() => { onRefresh(); onReconfigure() })
                        }}
                      />
                    : <div className="text-[13px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 truncate flex-1">not configured</div>
              }
              {TESTABLE_STEPS.includes(activeStep) && testState.status !== 'loading' && (
                <button
                  onClick={handleTest}
                  className="flex-shrink-0 text-[10px] font-mono px-2.5 py-1 rounded-md border transition-all duration-150 bg-dbx-blue-bg dark:bg-dbx-green-bg/10 text-dbx-blue dark:text-dbx-green border-dbx-blue/20 dark:border-dbx-green/20 hover:shadow-[0_0_8px_rgba(46,125,209,0.2)] dark:hover:shadow-[0_0_8px_rgba(0,169,114,0.2)]"
                >
                  test ↗
                </button>
              )}
            </div>
            {/* Line 2: test result message */}
            {testState.status === 'ok' && testState.message && (
              <div className="text-[11px] font-mono text-dbx-green mt-0.5 truncate animate-fade-in">
                [+] {testState.message}
              </div>
            )}
            {testState.status === 'fail' && testState.message && (
              <div className="text-[11px] font-mono text-dbx-red mt-0.5 truncate animate-fade-in">
                [x] {testState.message}
              </div>
            )}
          </>
        )}
      </div>

      {/* Trail */}
      <div className="flex items-center px-4 py-2.5 border-b border-dbx-gray-100 dark:border-dbx-gray-800 flex-shrink-0">
        {PHASES.map((p, i) => (
          <span key={p} className="flex items-center">
            <span className={`text-[11px] font-mono transition-colors duration-200 ${
              i < phaseIdx ? 'text-dbx-blue dark:text-dbx-green font-medium' : p === phase ? 'text-dbx-red dark:text-[#FF6B5A] font-semibold' : 'text-dbx-gray-300 dark:text-dbx-gray-600'
            }`}>
              {i < phaseIdx ? `✓ ${p}` : p}
            </span>
            {i < PHASES.length - 1 && <span className="text-[11px] text-dbx-gray-200 dark:text-dbx-gray-700 mx-2">›</span>}
          </span>
        ))}
      </div>

      {/* Instance detail panel (when a sub-instance is clicked) */}
      {selectedInstanceKey && phase === 'choose' && (() => {
        const inst = instances?.find(i => i.key === selectedInstanceKey)
        return (
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2">
            <div className="rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 p-4 animate-slide-up">
              <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-2">instance</div>
              <div className="text-[14px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 font-mono mb-1">
                {inst?.label || selectedInstanceKey}
              </div>
              <div className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mb-1">
                {selectedInstanceKey}
              </div>
              <div className="text-[12px] text-dbx-gray-500 dark:text-dbx-gray-400 font-mono mb-4 break-all">
                {inst?.value || '(not set)'}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block w-2 h-2 rounded-full ${inst?.enabled ? 'bg-dbx-blue dark:bg-dbx-green' : 'bg-dbx-gray-300'}`} />
                <span className="text-[11px] text-dbx-gray-500 dark:text-dbx-gray-400">{inst?.enabled ? 'enabled' : 'disabled'}</span>
              </div>

              {/* Test button */}
              <button
                onClick={() => handleInstanceTest(selectedInstanceKey)}
                disabled={instanceTest.status === 'loading'}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border border-dbx-gray-200 dark:border-dbx-gray-700 bg-dbx-gray-50 dark:bg-dbx-gray-800 hover:bg-dbx-gray-100 dark:hover:bg-dbx-gray-700 transition-all"
              >
                {instanceTest.status === 'loading' ? (
                  <span className="text-dbx-amber animate-pulse">testing...</span>
                ) : instanceTest.status === 'ok' ? (
                  <span className="text-dbx-blue dark:text-dbx-green">&#10003; {instanceTest.message}</span>
                ) : instanceTest.status === 'fail' ? (
                  <span className="text-dbx-error">&#10007; {instanceTest.message}</span>
                ) : (
                  <span className="text-dbx-gray-500">test connection</span>
                )}
              </button>

              {/* Voice feature: API key configuration */}
              {activeStep === 'features' && selectedInstanceKey === 'PROJECT_TOOL_VOICE' && (
                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-2">openai api key</div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={featureKeyInput}
                      onChange={(e) => setFeatureKeyInput(e.target.value)}
                      placeholder="sk-..."
                      className="flex-1 rounded-md border border-dbx-gray-200 dark:border-dbx-gray-700 bg-white dark:bg-dbx-gray-800 px-2.5 py-1.5 text-xs font-mono text-dbx-gray-800 dark:text-dbx-gray-100 placeholder:text-dbx-gray-400 dark:placeholder:text-dbx-gray-600 focus:outline-none focus:ring-1 focus:ring-dbx-blue dark:focus:ring-dbx-green"
                    />
                    <button
                      disabled={!featureKeyInput.trim() || featureKeySaving}
                      onClick={async () => {
                        setFeatureKeySaving(true)
                        try {
                          await fetch('/api/env', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ OPENAI_API_KEY: featureKeyInput.trim() }),
                          })
                          setFeatureKeyInput('')
                          // Re-test after saving
                          handleInstanceTest(selectedInstanceKey)
                          onRefresh()
                        } catch {}
                        setFeatureKeySaving(false)
                      }}
                      className="rounded-md border border-dbx-gray-200 dark:border-dbx-gray-700 bg-dbx-gray-50 dark:bg-dbx-gray-800 px-3 py-1.5 text-xs font-medium hover:bg-dbx-gray-100 dark:hover:bg-dbx-gray-700 transition-all disabled:opacity-50"
                    >
                      {featureKeySaving ? 'saving...' : 'save & test'}
                    </button>
                  </div>
                  <div className="text-[10px] text-dbx-gray-400 dark:text-dbx-gray-500 mt-1.5 font-mono">
                    writes OPENAI_API_KEY to .env.local
                  </div>
                </div>
              )}

              {/* Tools list for MCP/A2A */}
              {['mcp', 'a2a'].includes(activeStep) && (
                <div className="mt-4">
                  <div className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500 mb-2">
                    {toolsLoading ? 'discovering tools...' : instanceTools ? `${instanceTools.length} tool${instanceTools.length !== 1 ? 's' : ''} available` : 'tools'}
                  </div>
                  {toolsLoading && <div className="text-[11px] text-dbx-amber animate-pulse font-mono">connecting...</div>}
                  {instanceTools && instanceTools.length > 0 && (
                    <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                      {instanceTools.map(t => (
                        <div key={t.name} className="rounded-md border border-dbx-gray-200 dark:border-dbx-gray-700 bg-dbx-gray-50 dark:bg-dbx-gray-800/50 px-3 py-2">
                          <div className="text-[12px] font-semibold font-mono text-dbx-gray-800 dark:text-dbx-gray-100">{t.name}</div>
                          {t.description && <div className="text-[10px] text-dbx-gray-500 dark:text-dbx-gray-400 mt-0.5 leading-relaxed">{t.description}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {instanceTools && instanceTools.length === 0 && (
                    <div className="text-[11px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono">no tools exposed</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Body + footer */}
      {(!selectedInstanceKey || phase !== 'choose') && phase === 'choose' && renderChoose()}
      {phase === 'configure' && renderConfigure()}
      {phase === 'execute'   && renderExecute()}
      {phase === 'done'      && renderDone()}
    </div>
  )
}
