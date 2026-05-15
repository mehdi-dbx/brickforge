# Plan: Voice Feature Toggle (PROJECT_TOOL_VOICE)

## Context

Voice/speech-to-text is already fully implemented in BrickForge's chat app (ported from amadeus-checkin). MediaRecorder captures audio, Express backend proxies to OpenAI Whisper API, transcribed text auto-submits to chat. BUT it's always visible -- no toggle. Need to wire it to the `PROJECT_TOOL_VOICE` feature flag, decouple the voice logic, and add API key config in the setup app.

## What already exists

- `app/client/src/components/multimodal-input.tsx` -- mic button, MediaRecorder, voice state machine, transcribe(), all working
- `app/server/src/index.ts:197` -- `POST /api/audio/transcribe` endpoint with Whisper proxy
- `app/server/src/routes/config.ts` -- `GET /api/config` returns `{ features: { chatHistory: bool } }`
- `app/client/src/contexts/AppConfigContext.tsx` -- SWR-based config context, exposes `chatHistoryEnabled`
- `useAppConfig` already imported in multimodal-input.tsx (line 39, used at line 68)
- `.env.local` -- `#PROJECT_TOOL_VOICE=false` (commented out = disabled, already seeded)
- Visual app features block already shows `PROJECT_TOOL_VOICE` toggle
- Visual app drawer instance detail card already shows: label, key, value, enabled orb, test button (lines 1518-1580 of SetupDrawer.tsx)
- `handleInstanceTest` already calls `GET /api/setup/test?step={activeStep}&key={key}` (line 1029)
- `PUT /api/env` already writes arbitrary key=value pairs to `.env.local`

## Architecture: decoupled via custom hook

Voice logic extracted to a **hook** (not a component) because the listening animation and mic button live in different DOM positions within multimodal-input's flex layout.

```tsx
// use-voice.ts
export function useVoice(onTranscription: (text: string) => void, enabled: boolean) {
  // If !enabled: return idle state + noop callbacks (satisfies React hook rules)
  // If enabled: full state machine, MediaRecorder, transcription
  // Uses ref for onTranscription to avoid stale closures in async onstop callback
  // Includes useEffect cleanup to stop MediaRecorder + stream on unmount
  return { voiceState, startRecording, stopRecording, abortRecording }
}
```

Parent calls the hook unconditionally, renders UI conditionally.

## Layout constraint

```
[textarea] [listening bars] | [paperclip] [mic/stop] [cancel/send]
```

Listening bars are inside the textarea flex row. Mic button is in the button group. Cancel button is shared (voice abort OR streaming stop) but mutually exclusive (mic disabled during streaming). The hook returns state, the parent renders in the right DOM positions.

## What needs to change

### 1. NEW: `app/client/src/hooks/use-voice.ts`
Extract all voice logic from multimodal-input.tsx (lines 115-239):
- VoiceState type, state, refs (mediaRecorder, stream, chunks, mimeType)
- transcribe(), startRecording(), stopRecording(), abortRecording()
- Hook takes `(onTranscription, enabled)`, returns `{ voiceState, startRecording, stopRecording, abortRecording }`
- When `!enabled`: returns `{ voiceState: 'idle', startRecording: noop, stopRecording: noop, abortRecording: noop }`
- Uses `onTranscriptionRef` pattern to avoid stale closure in async `onstop` callback
- Imports `toast` from `sonner` directly (framework dep, already in package.json)
- **Cleanup on unmount**: `useEffect(() => () => { mediaRecorderRef.current?.stop(); streamRef.current?.getTracks().forEach(t => t.stop()) }, [])` -- fixes existing bug where mic stays on if component unmounts mid-recording

### 2. CLEAN: `app/client/src/components/multimodal-input.tsx`
- Remove ~120 lines of inline voice logic (state, refs, callbacks at lines 115-239)
- Add: `const { featureEnabled } = useAppConfig()` (extend existing destructure at line 68)
- Add: `const voiceEnabled = featureEnabled('voice')`
- Add: `const { voiceState, startRecording, stopRecording, abortRecording } = useVoice(submitForm, voiceEnabled)`
- Keep the JSX rendering (bars, mic button, cancel logic) gated on `voiceEnabled`
- `Mic` and `Loader2` icon imports stay (used in JSX)

### 3. UPDATE: `app/server/src/routes/config.ts`
Dynamic feature scanning instead of hardcoding each feature:
```typescript
const features: Record<string, boolean> = {
  chatHistory: isDatabaseAvailable(),
}
for (const [key, val] of Object.entries(process.env)) {
  if (key.startsWith('PROJECT_TOOL_')) {
    const slug = key.replace('PROJECT_TOOL_', '').toLowerCase()
    features[slug] = !!val?.trim() && val.trim().toLowerCase() !== 'false'
  }
}
// Voice also needs OPENAI_API_KEY
if (features.voice && !process.env.OPENAI_API_KEY?.trim()) {
  features.voice = false
}
res.json({ features })
```

Empty value (`PROJECT_TOOL_X=`) treated as disabled (not just `false`).

Note: env vars read at process startup. Config changes require chat app restart (same pattern as all other env vars).

### 4. UPDATE: `app/client/src/contexts/AppConfigContext.tsx`
- Change features type to preserve `chatHistory` autocomplete + allow dynamic access:
  ```typescript
  interface ConfigResponse {
    features: {
      chatHistory: boolean;
      [key: string]: boolean;
    };
  }
  ```
- Add to context interface: `featureEnabled: (name: string) => boolean`
- Add to context value: `featureEnabled: (name: string) => data?.features[name] ?? false`
- `chatHistoryEnabled` stays as shorthand with `?? true` default (backwards compat)
- `featureEnabled` defaults to `false` (conservative -- opt-in features hidden until config loads)

### 5. UPDATE: `visual/backend/index.js` -- SENSITIVE_PATTERN
Current pattern: `/TOKEN|SECRET|PASSWORD|PAT\b/i`
`OPENAI_API_KEY` contains "KEY" not "TOKEN" -- won't be masked in env editor.
Fix: update to `/TOKEN|SECRET|PASSWORD|PAT\b|API_KEY/i`

### 6. UPDATE: `visual/backend/index.js` -- test endpoint for features
Add `features` case in test endpoint. Dispatches per feature based on `envKey` param:
```javascript
} else if (step === 'features') {
  if (envKey === 'PROJECT_TOOL_VOICE') {
    // Test OPENAI_API_KEY validity via OpenAI /v1/models endpoint
    script = `
import os, urllib.request
key = os.environ.get('OPENAI_API_KEY','').strip()
if not key: print('[x] OPENAI_API_KEY not set'); exit(1)
try:
    req = urllib.request.Request('https://api.openai.com/v1/models', headers={'Authorization': f'Bearer {key}'})
    resp = urllib.request.urlopen(req, timeout=10)
    print('[+] OpenAI API key valid (' + str(resp.status) + ')')
except urllib.error.HTTPError as e:
    if e.code == 401: print('[x] invalid API key')
    else: print('[x] OpenAI API error: ' + str(e.code))
    exit(1)
except Exception as e:
    print('[x] ' + str(e)[:100]); exit(1)
`.trim()
  } else if (envKey === 'PROJECT_TOOL_CHART') {
    script = `print('[+] chart tool enabled')`
  }
}
```

### 7. UPDATE: `visual/frontend/src/components/SetupDrawer.tsx` -- API key input for voice
Extend the existing instance detail card (lines 1518-1580) with a special case for voice:

When `activeStep === 'features'` and `selectedInstanceKey === 'PROJECT_TOOL_VOICE'`:
- Show masked current value of `OPENAI_API_KEY` from env (first 7 chars + `***`)
- Input field to paste new key
- "Save & Test" button that:
  1. Calls `PUT /api/env` with `{ OPENAI_API_KEY: '<pasted value>' }` (existing endpoint)
  2. Then calls `handleInstanceTest(selectedInstanceKey)` (existing function)
- No new backend action needed -- composes two existing APIs

This follows the same pattern as the MCP/A2A tools list special case at line 1556.

## Walls identified and solved

| Wall | Solution |
|------|----------|
| `toast` dependency in hook | Import directly -- already a framework dep |
| Stale `submitForm` closure in async onstop | Use `onTranscriptionRef` pattern |
| MediaRecorder leak on unmount | Add `useEffect` cleanup (fixes existing bug) |
| Env vars read at startup only | Same as all other config -- restart required, documented |
| Empty `PROJECT_TOOL_*` value treated as enabled | Check `!!val?.trim() && !== 'false'` |
| TypeScript `Record` loses autocomplete for `chatHistory` | Index signature + explicit field |
| Test endpoint has no `features` handler | Add `features` case with per-feature dispatch |
| `OPENAI_API_KEY` not masked by SENSITIVE_PATTERN | Add `API_KEY` to regex pattern |
| Instance detail card is read-only | Add API key input as special case for voice |
| Cancel button shared between voice + streaming | Mutually exclusive (mic disabled during streaming) -- no conflict |
| Listening animation in different DOM position than mic | Hook returns state, parent renders in both positions |
| `save-openai-key` action initially planned | Unnecessary -- `PUT /api/env` already handles it |
| Deploy: OPENAI_API_KEY not in app.yaml | Follow-up task, not a blocker for toggle |

## Follow-up (not in scope)

- Add `OPENAI_API_KEY` to `app.yaml` secrets for production deploy
- Add `deploy/setup_openai_secret.sh` for Databricks secret scope provisioning
- Consider local Whisper model as fallback when OPENAI_API_KEY not available

## Verification

1. Open visual app, features block shows voice toggle with instance row
2. Click voice instance -> drawer shows instance detail with API key input
3. Paste key, click "Save & Test" -> writes to .env.local, tests against OpenAI API
4. Green orb if valid, red if not
5. Toggle voice on -> `PROJECT_TOOL_VOICE=true` in .env.local
6. Start chat app -> mic button visible (if both key + toggle set)
7. Click mic -> listening bars animate, release -> transcription -> auto-submit
8. Toggle voice off -> mic button hidden, no voice code active
9. Remove `OPENAI_API_KEY` -> mic button hidden even if toggle is on
10. Navigate away mid-recording -> mic stops, stream cleaned up (no leak)
11. `PROJECT_TOOL_CHART` visible in features block, always passes test
12. Empty `PROJECT_TOOL_VOICE=` (no value) -> treated as disabled
