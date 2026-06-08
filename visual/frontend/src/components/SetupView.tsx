import { useCallback, useEffect, useState } from 'react'
import type { StepId, SetupPhase, StepState, ExecLine } from '../types'
import { SetupDag } from './SetupDag'
import { SetupDrawer, type TestResult } from './SetupDrawer'
import { SETUP_STEPS } from '../setupSteps'

const ALL_STEP_IDS = SETUP_STEPS.map(s => s.id)

function makeDefaultStates(): Record<StepId, StepState> {
  return Object.fromEntries(ALL_STEP_IDS.map(id => [id, { status: 'missing' as const, values: {} }])) as Record<StepId, StepState>
}

export function SetupView() {
  const [stepStates, setStepStates]         = useState<Record<StepId, StepState>>(makeDefaultStates)
  const [activeStep, setActiveStep]         = useState<StepId>('host')
  const [phase, setPhase]                   = useState<SetupPhase>('choose')
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [execLines, setExecLines]           = useState<ExecLine[]>([])
  const [testCache, setTestCache]           = useState<Partial<Record<StepId, TestResult>>>({})
  const [selectedInstanceKey, setSelectedInstanceKey] = useState<string | null>(null)
  const [forgeMode, setForgeMode] = useState(false)

  const refreshStatus = useCallback(() => {
    fetch('/api/setup/status')
      .then(r => r.json() as Promise<{ steps: Record<string, { status: string; values: Record<string, string>; instances?: { key: string; value: string; enabled: boolean; label: string }[] }>; forgeMode?: boolean }>)
      .then(({ steps, forgeMode: fm }) => {
        if (fm != null) setForgeMode(fm)
        const next = makeDefaultStates()
        for (const [id, s] of Object.entries(steps)) {
          if (id in next) {
            next[id as StepId] = {
              status: s.status === 'configured' ? 'done' : s.status === 'unknown' ? 'unknown' : 'missing',
              values: s.values,
              instances: s.instances,
            }
          }
        }
        setStepStates(next)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { refreshStatus() }, [refreshStatus])

  // Re-fetch status when project is switched
  useEffect(() => {
    const handler = () => refreshStatus()
    window.addEventListener('project-switched', handler)
    return () => window.removeEventListener('project-switched', handler)
  }, [refreshStatus])

  useEffect(() => {
    const handler = (e: Event) => {
      const { text, stream } = (e as CustomEvent<ExecLine>).detail
      setExecLines(prev => [...prev, { text, stream }])
    }
    window.addEventListener('exec-line', handler)
    return () => window.removeEventListener('exec-line', handler)
  }, [])

  const handleActivate = useCallback((id: StepId, forceAdd?: boolean) => {
    setActiveStep(id)
    setExecLines([])
    setSelectedInstanceKey(null)
    // If block is already done (configured), go straight to done phase -- unless adding new instance
    const currentStatus = stepStates[id]?.status
    if (currentStatus === 'done' && !forceAdd) {
      setSelectedChoice(null)
      setPhase('done')
      refreshStatus()
      // Fetch last exec log for this block
      fetch(`/api/setup/exec-log?step=${id}`)
        .then(r => r.json())
        .then(data => { if (data.lines?.length) setExecLines(data.lines.map((l: string) => ({ text: l, stream: 'out' }))) })
        .catch(() => {})
      return
    }
    // Single-choice blocks: skip choose phase, go straight to configure
    const step = SETUP_STEPS.find(s => s.id === id)
    if (step && step.choices.length === 1) {
      setSelectedChoice(0)
      setPhase('configure')
    } else {
      setSelectedChoice(null)
      setPhase('choose')
    }
    refreshStatus()
  }, [refreshStatus, stepStates])

  // Listen for activate-step events (e.g. from data/routines wizards)
  useEffect(() => {
    const handler = (e: Event) => {
      const stepId = (e as CustomEvent<StepId>).detail
      if (ALL_STEP_IDS.includes(stepId)) handleActivate(stepId)
    }
    window.addEventListener('activate-step', handler)
    return () => window.removeEventListener('activate-step', handler)
  }, [handleActivate])

  const handleClickInstance = useCallback((stepId: StepId, key: string) => {
    setActiveStep(stepId)
    setSelectedInstanceKey(key)
    setPhase('choose')
    setSelectedChoice(null)
    setExecLines([])
  }, [])

  const handleContinue = useCallback(() => {
    const step = SETUP_STEPS.find(s => s.id === activeStep)!
    if (selectedChoice === null) return
    // Filter choices same as SetupDrawer does in forge mode
    const CLI_ACTIONS = new Set(['cfg-profile', 'cfg-new'])
    const DEPLOY_CLI_ACTIONS = new Set<string>()
    const choices = forgeMode
      ? step.choices.filter(c => !CLI_ACTIONS.has(c.action) && !DEPLOY_CLI_ACTIONS.has(c.action))
      : step.choices
    const action = choices[selectedChoice].action

    if (action === 'done') { setPhase('done'); return }

    // gen-data: switch to the Data tab's generate wizard
    if (action === 'gen-data') {
      window.dispatchEvent(new CustomEvent('switch-view', { detail: 'data' }))
      window.dispatchEvent(new CustomEvent('data-mode', { detail: 'generate' }))
      return
    }

    // gen-routines: switch to the Data tab's routines wizard
    if (action === 'gen-routines') {
      window.dispatchEvent(new CustomEvent('switch-view', { detail: 'data' }))
      window.dispatchEvent(new CustomEvent('data-mode', { detail: 'routines' }))
      return
    }

    // Already in configure — advance to execute (unless action handles its own lifecycle)
    const SELF_CONTAINED = new Set(['forge-bridge', 'cfg-prompt', 'cfg-prompt-gen'])
    if (phase === 'configure' && !SELF_CONTAINED.has(action)) {
      setExecLines([])
      setPhase('execute')
      return
    }

    // Actions that go straight to execute (no configure phase)
    const DIRECT_EXEC = new Set(['exec-assets', 'exec-tables',
      'exec-mlflow', 'exec-grants',
      'exec-deploy-agent', 'exec-same', 'exec-git-push'])
    if (DIRECT_EXEC.has(action)) {
      setExecLines([])
      setPhase('execute')
      return
    }

    // Everything else goes to configure
    setPhase('configure')
  }, [activeStep, selectedChoice, phase])

  const handleBack = useCallback(() => {
    setPhase(prev => {
      if (prev === 'configure') return 'choose'
      if (prev === 'execute')   return 'configure'
      if (prev === 'done')      return 'choose'
      return 'choose'
    })
  }, [])

  const handleNext = useCallback(() => {
    const idx = ALL_STEP_IDS.indexOf(activeStep)
    if (idx < ALL_STEP_IDS.length - 1) handleActivate(ALL_STEP_IDS[idx + 1])
  }, [activeStep, handleActivate])

  const handleTestResult = useCallback((step: StepId, result: TestResult) => {
    setTestCache(prev => ({ ...prev, [step]: result }))
  }, [])

  const handleReconfigure = useCallback(() => {
    setPhase('choose')
    setSelectedChoice(null)
    setExecLines([])
    // Invalidate cache for this step + dependents
    setTestCache(prev => {
      const next = { ...prev }
      delete next[activeStep]
      if (activeStep === 'schema') {
        for (const dep of SCHEMA_DEPENDENTS) delete next[dep]
      }
      return next
    })
  }, [activeStep])

  // Steps whose test results depend on schema being set
  const SCHEMA_DEPENDENTS: StepId[] = ['tables', 'functions', 'genie']

  const handleExecDone = useCallback((ok: boolean) => {
    setStepStates(prev => ({
      ...prev,
      [activeStep]: { ...prev[activeStep], status: ok ? 'done' : 'error' },
    }))
    // Invalidate test cache — value changed, needs re-verification next visit
    setTestCache(prev => {
      const next = { ...prev }
      delete next[activeStep]
      // When schema changes, invalidate all dependent blocks
      if (activeStep === 'schema') {
        for (const dep of SCHEMA_DEPENDENTS) delete next[dep]
      }
      return next
    })
    setTimeout(() => {
      setPhase('done')
      if (ok) refreshStatus()
    }, 600)
  }, [activeStep, refreshStatus])

  // Merge test results into step states: configured + test fail = warning (amber)
  const effectiveStates = { ...stepStates }
  for (const id of ALL_STEP_IDS) {
    const test = testCache[id]
    if (effectiveStates[id].status === 'done' && test?.status === 'fail') {
      effectiveStates[id] = { ...effectiveStates[id], status: 'warning' }
    }
  }

  const readyCount = ALL_STEP_IDS.filter(id => effectiveStates[id].status === 'done').length

  const handleToggleInstance = useCallback(async (key: string) => {
    try {
      await fetch('/api/setup/toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      refreshStatus()
    } catch {}
  }, [refreshStatus])

  const handleToggleAllInstances = useCallback(async (stepId: StepId) => {
    const instances = stepStates[stepId]?.instances || []
    if (!instances.length) return
    // If any enabled -> disable all; if all disabled -> enable all
    const anyEnabled = instances.some(i => i.enabled)
    const toToggle = instances.filter(i => i.enabled === anyEnabled)
    for (const inst of toToggle) {
      await fetch('/api/setup/toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: inst.key }),
      })
    }
    refreshStatus()
  }, [stepStates, refreshStatus])

  const handleDeleteInstance = useCallback(async (key: string) => {
    try {
      await fetch('/api/setup/instance', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      setSelectedInstanceKey(null)
      refreshStatus()
    } catch {}
  }, [refreshStatus])

  return (
    <div className="flex h-full bg-dbx-gray-50 dark:bg-dbx-gray-950">
      {/* Left: DAG fills remaining space */}
      <div className="flex-1 min-w-0">
        <SetupDag
          stepStates={effectiveStates}
          activeStep={activeStep}
          onActivate={handleActivate}
          onToggleInstance={handleToggleInstance}
          onToggleAllInstances={handleToggleAllInstances}
          onClickInstance={handleClickInstance}
          onDeleteInstance={handleDeleteInstance}
          readyCount={readyCount}
          totalCount={ALL_STEP_IDS.length}
          connected={effectiveStates.host.status === 'done'}
        />
      </div>

      {/* Right: fixed 480px drawer stuck to right edge */}
      <div className="w-[480px] flex-shrink-0 border-l border-dbx-gray-200 dark:border-dbx-gray-800">
        <SetupDrawer
          activeStep={activeStep}
          phase={phase}
          selectedChoice={selectedChoice}
          execLines={execLines}
          currentValues={{ ...stepStates.host.values, ...stepStates.schema.values, ...stepStates[activeStep].values }}
          stepStatus={stepStates[activeStep]?.status || 'missing'}
          testCache={testCache}
          onTestResult={handleTestResult}
          onSelectChoice={setSelectedChoice}
          onContinue={handleContinue}
          onBack={handleBack}
          onReconfigure={handleReconfigure}
          onNext={ALL_STEP_IDS.indexOf(activeStep) < ALL_STEP_IDS.length - 1 ? handleNext : undefined}
          onExecDone={handleExecDone}
          onRefresh={refreshStatus}
          selectedInstanceKey={selectedInstanceKey}
          instances={stepStates[activeStep]?.instances}
          forgeMode={forgeMode}
        />
      </div>
    </div>
  )
}
