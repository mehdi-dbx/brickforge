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

  const refreshStatus = useCallback(() => {
    fetch('/api/setup/status')
      .then(r => r.json() as Promise<{ steps: Record<string, { status: string; values: Record<string, string>; instances?: { key: string; value: string; enabled: boolean; label: string }[] }> }>)
      .then(({ steps }) => {
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

  useEffect(() => {
    const handler = (e: Event) => {
      const { text, stream } = (e as CustomEvent<ExecLine>).detail
      setExecLines(prev => [...prev, { text, stream }])
    }
    window.addEventListener('exec-line', handler)
    return () => window.removeEventListener('exec-line', handler)
  }, [])

  const handleActivate = useCallback((id: StepId) => {
    setActiveStep(id)
    setPhase('choose')
    setSelectedChoice(null)
    setExecLines([])
  }, [])

  const handleContinue = useCallback(() => {
    const step = SETUP_STEPS.find(s => s.id === activeStep)!
    if (selectedChoice === null) return
    const action = step.choices[selectedChoice].action

    if (action === 'done') { setPhase('done'); return }

    // Already in configure — always advance to execute
    if (phase === 'configure') {
      setExecLines([])
      setPhase('execute')
      return
    }

    const NEEDS_CONFIGURE = ['cfg-profile', 'cfg-warehouse', 'cfg-catalog', 'cfg-genie',
      'cfg-grants', 'cfg-new', 'cfg-ka', 'cfg-deploy-name', 'cfg-prompt', 'cfg-prompt-gen', 'manual', 'exec-genie']
    if (NEEDS_CONFIGURE.includes(action)) { setPhase('configure'); return }

    setExecLines([])
    setPhase('execute')
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
    // Invalidate cache for this step so it re-tests after reconfigure
    setTestCache(prev => { const next = { ...prev }; delete next[activeStep]; return next })
  }, [activeStep])

  const handleExecDone = useCallback((ok: boolean) => {
    setStepStates(prev => ({
      ...prev,
      [activeStep]: { ...prev[activeStep], status: ok ? 'done' : 'error' },
    }))
    // Invalidate test cache — value changed, needs re-verification next visit
    setTestCache(prev => { const next = { ...prev }; delete next[activeStep]; return next })
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
          readyCount={readyCount}
          totalCount={ALL_STEP_IDS.length}
        />
      </div>

      {/* Right: fixed 480px drawer stuck to right edge */}
      <div className="w-[480px] flex-shrink-0 border-l border-dbx-gray-200 dark:border-dbx-gray-800">
        <SetupDrawer
          activeStep={activeStep}
          phase={phase}
          selectedChoice={selectedChoice}
          execLines={execLines}
          currentValues={{ ...stepStates.schema.values, ...stepStates[activeStep].values }}
          testCache={testCache}
          onTestResult={handleTestResult}
          onSelectChoice={setSelectedChoice}
          onContinue={handleContinue}
          onBack={handleBack}
          onReconfigure={handleReconfigure}
          onNext={ALL_STEP_IDS.indexOf(activeStep) < ALL_STEP_IDS.length - 1 ? handleNext : undefined}
          onExecDone={handleExecDone}
          onRefresh={refreshStatus}
        />
      </div>
    </div>
  )
}
