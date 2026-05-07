import { useEffect, useRef, useState, useCallback } from 'react'

interface GenTerminalProps {
  /** POST endpoint URL */
  url: string
  /** Request body (JSON-serializable) */
  body: Record<string, unknown>
  /** Called when `event:result` arrives */
  onResult?: (data: unknown) => void
  /** Called when stream ends */
  onDone?: (ok: boolean) => void
  /** Increment to trigger a new request. 0 = inactive. */
  triggerKey: number
}

function colorize(text: string): string {
  return text
    .replace(/\[x\]/g, '<span class="text-red-400">[x]</span>')
    .replace(/\[\+\]/g, '<span class="text-emerald-400">[+]</span>')
    .replace(/\[~\]/g, '<span class="text-amber-400">[~]</span>')
    .replace(/\[\?\]/g, '<span class="text-dbx-gray-400">[?]</span>')
}

export function GenTerminal({ url, body, onResult, onDone, triggerKey }: GenTerminalProps) {
  const [lines, setLines] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Keep current props in refs so the fetch closure always reads latest values
  const urlRef = useRef(url)
  const bodyRef = useRef(body)
  const onResultRef = useRef(onResult)
  const onDoneRef = useRef(onDone)
  urlRef.current = url
  bodyRef.current = body
  onResultRef.current = onResult
  onDoneRef.current = onDone

  const appendLine = useCallback((text: string) => {
    setLines(prev => [...prev, text])
  }, [])

  useEffect(() => {
    if (triggerKey === 0) return
    setLines([])
    setRunning(true)
    let aborted = false

    async function run() {
      try {
        const resp = await fetch(urlRef.current, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyRef.current),
        })
        if (!resp.body) { setRunning(false); onDoneRef.current?.(false); return }

        const reader = resp.body.getReader()
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

            if (evtType === 'line') {
              const text = parsed.text || ''
              if (text.includes('VIRTUAL_ENV=') && text.includes('will be ignored')) continue
              appendLine(text)
            } else if (evtType === 'result') {
              onResultRef.current?.(parsed)
            } else if (evtType === 'done' && !aborted) {
              setRunning(false)
              onDoneRef.current?.(parsed.ok)
            }
          }
        }
      } catch (e) {
        console.error('[gen-terminal]', e)
        appendLine(`[x] ${e}\n`)
        if (!aborted) { setRunning(false); onDoneRef.current?.(false) }
      }
    }

    run()
    return () => { aborted = true }
  }, [triggerKey, appendLine])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [lines])

  if (triggerKey === 0) return null

  return (
    <div className="rounded-lg border border-dbx-gray-200 dark:border-dbx-gray-800 bg-dbx-gray-950 dark:bg-black overflow-hidden">
      <div className="h-1 bg-dbx-gray-800">
        {running && (
          <div key={triggerKey} className="h-full bg-emerald-500 animate-fill-bar rounded-r-sm" />
        )}
      </div>
      <div
        ref={scrollRef}
        className="p-3 max-h-48 overflow-y-auto font-mono text-[11px] leading-relaxed text-dbx-gray-300 scrollbar-thin"
      >
        {lines.length === 0 && running && (
          <span className="text-dbx-gray-500 animate-pulse">generating...</span>
        )}
        {lines.map((line, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: colorize(line) }} />
        ))}
      </div>
    </div>
  )
}
