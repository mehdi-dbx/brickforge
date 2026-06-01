# Chart Tool -- Implementation Reference

## Overview

The agent can generate interactive charts inline in the chat UI. When a user asks for a visualization, the agent calls the `generate_chart` tool which returns a Recharts-compatible config. The frontend detects it and renders an interactive chart with type toggle buttons.

## Architecture

```
User: "show me a bar chart of flights by terminal"
    |
    v
Agent (LangGraph) calls generate_chart tool
    |
    v
Tool returns: ```chart\n{JSON config}\n```
    |
    v
Express API streams response as SSE (unchanged)
    |
    v
Frontend response-blocks.ts detects ```chart code fence
    |
    v
Parses JSON into ChartConfig object
    |
    v
message.tsx renders <ChartCard data={config} />
    |
    v
Recharts renders interactive bar/line/area/pie chart
```

## Files

| File | Role |
|------|------|
| `tools/generate_chart.py` | `@tool` function -- validates inputs, returns chart code fence |
| `agent/agent.py` | Registers tool (conditional on `PROJECT_TOOL_CHART` env var) |
| `app/client/src/lib/response-blocks.ts` | Parses `chart` code fence, extracts JSON config |
| `app/client/src/components/elements/chart-card.tsx` | Recharts renderer with type toggle |
| `app/client/src/components/message.tsx` | Routes `chart` segments to `ChartCard` |

## Tool: `generate_chart`

### Parameters

All parameters are strings (for reliable LLM function calling):

| Param | Type | Example |
|-------|------|---------|
| `chart_type` | `"bar"` / `"line"` / `"area"` / `"pie"` | `"bar"` |
| `title` | Chart title | `"Flights by Terminal"` |
| `headers` | Comma-separated column names | `"terminal,count"` |
| `rows` | JSON array of arrays | `'[["T1",42],["T2",38]]'` |
| `x_column` | Column name for X axis | `"terminal"` |
| `y_column` | Column name for Y axis | `"count"` |

### Output format

The tool returns a markdown code fence that the frontend auto-detects:

````
```chart
{"type":"bar","title":"Flights by Terminal","headers":["terminal","count"],"rows":[["T1",42],["T2",38],["T3",55]],"x_column":0,"y_column":1}
```
````

### Error handling

Invalid inputs return plain error strings (not exceptions):
- `"Error: chart_type must be one of {'bar','line','area','pie'}, got 'heatmap'"`
- `"Error: x_column 'c' not found in headers ['a', 'b']"`
- `"Error parsing rows: ..."`

The agent sees these errors and can retry with corrected inputs.

## Frontend: Response Block Parser

**File**: `app/client/src/lib/response-blocks.ts`

The parser detects ` ```chart ` code fences as a dedicated block type (alongside `refresh_table` and `knowledge_base`). It parses the JSON content and emits:

```typescript
{ type: 'chart', content: rawJson, parsed: ChartConfig }
```

This is handled before the domain card registry, making charts a **framework-level** feature (not domain-specific).

## Frontend: ChartCard Component

**File**: `app/client/src/components/elements/chart-card.tsx`

### Features
- **4 chart types**: Area, Line, Bar, Pie -- togglable via buttons at top-right
- **Responsive**: `ResponsiveContainer` fills parent width, fixed 280px height
- **Dark mode**: Tooltip styled with dark background (`#1f2937`), grid with low opacity
- **Area gradient**: Blue gradient fill (4-stop SVG linearGradient)
- **Axis formatting**: Y-axis shortens large numbers (K/M), X-axis truncates long labels and formats dates
- **Pie chart**: Donut style with inner radius, percentage labels, 10-color palette
- **No dots on lines**: Cleaner look for line/area charts

### ChartConfig interface

```typescript
interface ChartConfig {
  type: 'bar' | 'line' | 'area' | 'pie'
  title: string
  headers: string[]
  rows: (string | number)[][]
  x_column: number  // index into headers
  y_column: number  // index into headers
}
```

## Feature Toggle

**Env var**: `PROJECT_TOOL_CHART=true|false`

- Default: `true` (enabled)
- Set to `false` to disable the chart tool at agent startup
- Visible in the Setup App under the **features** block with on/off toggle
- Agent checks at init: `os.environ.get("PROJECT_TOOL_CHART", "true").strip().lower() != "false"`

The features block in the Setup App uses the `PROJECT_TOOL_*` prefix pattern -- same multi-instance toggle as genie/ka/vs.

## Dependencies

- `recharts` (npm) -- added to `app/client/package.json`
- No Python dependencies added (tool uses only stdlib `json`)

## How to test

1. Ensure `PROJECT_TOOL_CHART=true` in `.env.local`
2. Start the local dev stack: `bash scripts/sh/start_local.sh`
3. Open chat at `http://localhost:3000`
4. Ask: "Show me a bar chart of flights by terminal"
5. Agent calls `generate_chart`, returns chart code fence
6. Chat renders interactive Recharts bar chart
7. Click area/line/pie buttons to switch chart type
8. Hover for tooltips
