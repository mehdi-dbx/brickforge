import { useEffect, useRef, useState, useCallback } from 'react'
import { FileText, Upload, Trash2, ExternalLink, Link } from 'lucide-react'

interface VolumeFile {
  name: string
  path: string
  size: number
  modified: string | null
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function KaDocsView() {
  const [files, setFiles] = useState<VolumeFile[]>([])
  const [volumePath, setVolumePath] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<{ name: string; ok: boolean; error?: string; steps?: string[]; size?: number }[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [urlUploading, setUrlUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = useCallback(() => {
    setLoading(true)
    setError('')
    fetch('/api/ka/documents')
      .then(r => r.json())
      .then(data => {
        setFiles(data.files || [])
        setVolumePath(data.volumePath || '')
        if (data.error && data.files?.length === 0) setError(data.error)
        setLoading(false)
      })
      .catch(e => {
        setError(String(e))
        setLoading(false)
      })
  }, [])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setUploadResults([])

    const formData = new FormData()
    for (const file of Array.from(selectedFiles)) {
      formData.append('files', file)
    }

    try {
      const resp = await fetch('/api/ka/upload', { method: 'POST', body: formData })
      const data = await resp.json()
      setUploadResults(data.uploaded || [])
      fetchDocuments()
    } catch (err) {
      setUploadResults([{ name: 'upload', ok: false, error: String(err) }])
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (name: string) => {
    setDeleting(name)
    try {
      await fetch(`/api/ka/documents/${encodeURIComponent(name)}`, { method: 'DELETE' })
      fetchDocuments()
    } catch (err) {
      setError(String(err))
    } finally {
      setDeleting(null)
    }
  }

  const handleUrlUpload = async () => {
    const url = urlInput.trim()
    if (!url) return
    setUrlUploading(true)
    setUploadResults([])
    try {
      const resp = await fetch('/api/ka/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await resp.json()
      setUploadResults([data])
      if (data.ok) setUrlInput('')
      fetchDocuments()
    } catch (err) {
      setUploadResults([{ name: url, ok: false, error: String(err) }])
    } finally {
      setUrlUploading(false)
    }
  }

  // Fetch KA endpoint name from env
  const [kaEndpoint, setKaEndpoint] = useState('')
  useEffect(() => {
    fetch('/api/env')
      .then(r => r.json())
      .then((entries: { key: string; value: string }[]) => {
        const ka = entries.find(e => e.key.startsWith('PROJECT_KA_'))
        if (ka?.value) setKaEndpoint(ka.value)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="h-full overflow-y-auto bg-dbx-gray-50 dark:bg-dbx-gray-950 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-[14px] font-semibold text-dbx-gray-800 dark:text-dbx-gray-100 font-mono">KA / Documents</h2>
          <p className="text-[12px] text-dbx-gray-400 dark:text-dbx-gray-500 font-mono mt-1">
            Manage Knowledge Assistant source documents in the UC Volume
          </p>
        </div>

        {/* Status bar */}
        <div className="mb-6 rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 px-4 py-3">
          <div className="flex items-center gap-6 text-[11px] font-mono">
            <div>
              <span className="text-dbx-gray-400 dark:text-dbx-gray-500">volume: </span>
              <span className="text-dbx-gray-600 dark:text-dbx-gray-300">{volumePath || 'not configured'}</span>
            </div>
            <div>
              <span className="text-dbx-gray-400 dark:text-dbx-gray-500">ka endpoint: </span>
              <span className={kaEndpoint ? 'text-dbx-blue dark:text-dbx-green' : 'text-dbx-gray-400'}>{kaEndpoint || 'not set'}</span>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('switch-view', { detail: 'setup' }))}
              className="ml-auto flex items-center gap-1 text-[10px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500 hover:text-dbx-blue dark:hover:text-dbx-green transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> configure in setup
            </button>
          </div>
        </div>

        {/* Upload section */}
        <div className="mb-6 space-y-3">
          {/* File upload */}
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md,.html"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !volumePath}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-[12px] font-mono font-medium bg-dbx-red text-white hover:bg-[#E02E1C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'uploading...' : 'upload files'}
            </button>
            <span className="text-[10px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500">or</span>
            {/* URL upload */}
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-dbx-gray-400" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleUrlUpload() }}
                  placeholder="paste URL to download..."
                  disabled={urlUploading || !volumePath}
                  className="w-full bg-white dark:bg-dbx-gray-900 font-mono text-[11px] text-dbx-gray-600 dark:text-dbx-gray-300 outline-none border border-dbx-gray-200 dark:border-dbx-gray-700 rounded-md pl-7 pr-3 py-2 focus:border-dbx-red dark:focus:border-[#FF6B5A] transition-colors disabled:opacity-50"
                />
              </div>
              <button
                onClick={handleUrlUpload}
                disabled={!urlInput.trim() || urlUploading || !volumePath}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-mono font-medium border border-dbx-gray-200 dark:border-dbx-gray-700 text-dbx-gray-500 dark:text-dbx-gray-400 hover:border-dbx-gray-400 dark:hover:border-dbx-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {urlUploading ? 'downloading...' : 'fetch'}
              </button>
            </div>
          </div>

          {!volumePath && (
            <p className="text-[11px] font-mono text-dbx-amber">
              Set PROJECT_UNITY_CATALOG_SCHEMA in Setup first to enable uploads
            </p>
          )}

          {/* Progress bar */}
          {(uploading || urlUploading) && (
            <div className="mt-3 h-1 bg-dbx-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 animate-fill-bar rounded-r-sm" />
            </div>
          )}

          {/* Upload results */}
          {uploadResults.length > 0 && (
            <div className="mt-3 space-y-1">
              {uploadResults.map((r, i) => (
                <div key={i}>
                  {/* Step log */}
                  {r.steps?.map((s: string, j: number) => (
                    <div key={j} className={`text-[11px] font-mono ${
                      s.startsWith('[+]') ? 'text-emerald-400' : s.startsWith('[x]') ? 'text-red-400' : 'text-dbx-gray-400'
                    }`}>{s}</div>
                  ))}
                  {/* Final result */}
                  <div className={`text-[11px] font-mono ${r.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.ok ? '[+]' : '[x]'} {r.name} {r.error ? `— ${r.error}` : r.size ? `(${formatSize(r.size)})` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-[12px] font-mono text-dbx-gray-400 animate-pulse">loading documents...</div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-[12px] font-mono text-dbx-amber mb-4">[~] {error}</div>
        )}

        {/* Empty state */}
        {!loading && files.length === 0 && !error && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-dbx-gray-300 dark:text-dbx-gray-600 mb-3">
              <FileText className="w-8 h-8 mx-auto" />
            </div>
            <div className="text-[13px] font-mono text-dbx-gray-500 dark:text-dbx-gray-400 mb-1">No documents in volume</div>
            <p className="text-[12px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500">
              Upload PDFs or other documents to use as Knowledge Assistant sources
            </p>
          </div>
        )}

        {/* File list */}
        {!loading && files.length > 0 && (
          <div className="rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-white dark:bg-dbx-gray-900 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-dbx-gray-100 dark:border-dbx-gray-800 flex items-center">
              <span className="text-[10px] uppercase tracking-widest font-mono font-medium text-dbx-gray-400 dark:text-dbx-gray-500">
                volume documents ({files.length})
              </span>
            </div>
            {files.map((file, i) => (
              <div
                key={file.name}
                className={`flex items-center gap-3 px-4 py-2.5 group ${
                  i < files.length - 1 ? 'border-b border-dbx-gray-50 dark:border-dbx-gray-800/50' : ''
                }`}
              >
                <FileText className="w-4 h-4 text-dbx-gray-300 dark:text-dbx-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-mono text-dbx-gray-700 dark:text-dbx-gray-200 truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-[10px] font-mono text-dbx-gray-400 dark:text-dbx-gray-500">
                    {formatSize(file.size)}
                    {file.modified && ` -- ${file.modified}`}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(file.name)}
                  disabled={deleting === file.name}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-dbx-gray-300 hover:text-red-500 transition-all disabled:opacity-50"
                  title="Delete from volume"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
