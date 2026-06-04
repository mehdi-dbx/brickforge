# BrickForge -- Agentic Memory Architecture

Design document for adding stateful agent support to BrickForge: short-term conversation persistence, long-term user memory, and long-running execution.

---

## Overview

Three features, one backend (Lakebase):

| Feature | What it does | Backend |
|---------|-------------|---------|
| **Short-term memory** | Conversations persist across page refresh. Same thread = same context. | AsyncCheckpointSaver -> Lakebase |
| **Long-term memory** | Agent remembers user preferences across different conversations. | AsyncDatabricksStore -> Lakebase + embeddings |
| **Long-running execution** | Complex multi-tool chains don't time out at 300s. Tasks run async. | LongRunningAgentServer -> Lakebase |

All three use the same Lakebase (managed Postgres) instance. Tables are created automatically on first startup.

---

## Reference Implementation

Source: `databricks/app-templates/tree/main/agent-langgraph-advanced`

Key files studied:
- `agent_server/utils_memory.py` -- Lakebase integration, memory tools, config resolution
- `agent_server/start_server.py` -- LongRunningAgentServer bootstrap, lifespan management
- `agent_server/agent.py` -- Agent definition with TypedDict state, checkpointer, store
- `agent_server/utils.py` -- Thread ID resolution, streaming event processing
- `scripts/grant_lakebase_permissions.py` -- SP permission automation

---

## Short-term Memory (Thread Checkpointing)

### How it works

Each conversation gets a `thread_id`. The agent's state (messages, tool results, internal state) is saved to Lakebase after every turn via LangGraph's checkpointing. When the same `thread_id` is used again, the full conversation history is restored.

### Components

```
AsyncCheckpointSaver(
    instance_name="agent-forge-lakebase",
) as checkpointer
```

- From `databricks-ai-bridge` (not raw `PostgresSaver`)
- Takes `instance_name` directly -- no connection string needed
- Creates tables on startup: `checkpoints`, `checkpoint_writes`, `checkpoint_blobs`, `checkpoint_migrations`
- Schema configurable via `LAKEBASE_AGENT_MEMORY_SCHEMA` env var (default: `agent_memory`)

### Thread ID flow

```
Browser (localStorage)
    |
    v
React frontend -- sends thread_id in request body
    |
    v
Express API -- passes thread_id header to backend
    |
    v
Agent backend -- reads from custom_inputs or generates UUID7
    |
    v
config = {"configurable": {"thread_id": thread_id}}
    |
    v
LangGraph agent.invoke(input, config) -- checkpoint loaded/saved automatically
```

Thread ID priority:
1. `custom_inputs.thread_id` (explicit from frontend)
2. `request.context.conversation_id` (from MLflow request context)
3. Auto-generated UUID7 (sortable, timestamp-ordered)

### User-facing behavior

- Close browser, come back, same conversation is there
- Sidebar to list and switch between past conversations
- Page refresh doesn't lose context

---

## Long-term Memory (Cross-session User Profiles)

### How it works

The agent has three memory tools it can call during conversation. Memories are stored as vectors in Lakebase, searchable via semantic similarity. Each user has their own isolated namespace.

### Components

```
AsyncDatabricksStore(
    instance_name="agent-forge-lakebase",
    embedding_endpoint="databricks-gte-large-en",
    embedding_dims=1024,
    schema="agent_memory",
) as store
```

- Creates tables: `store`, `store_vectors`, `store_migrations`
- Uses `databricks-gte-large-en` for embeddings (Databricks-hosted, no external API)
- Namespace per user: `("user_memories", user_id.replace(".", "-"))`

### Memory tools

| Tool | Purpose | When agent uses it |
|------|---------|-------------------|
| `get_user_memory(query)` | Semantic search across saved facts | Before answering, to check if user has stated preferences |
| `save_user_memory(memory_key, memory_data_json)` | Persist a user fact/preference | When user says "remember that I...", or agent infers a preference |
| `delete_user_memory(memory_key)` | Remove a specific memory | When user says "forget that" |

### User identity

| Runtime mode | User ID source |
|-------------|---------------|
| **Databricks App** | SSO identity flows automatically from workspace auth |
| **Local dev** | Hardcoded dev user_id (e.g. `"local-dev"`) |

No custom user system needed. Memory tools are only activated when `user_id` is available in the request.

### Configuration

Opt-in via `.forge` config:

```yaml
agent:
  long_term_memory: true
```

When disabled, memory tools are not registered with the agent.

---

## Long-running Execution

### The problem

Databricks Apps HTTP timeout is ~300 seconds. Complex agent workflows (multi-tool chains, KA queries, data generation) can exceed this.

### The solution

`LongRunningAgentServer` from `databricks-ai-bridge` decouples agent execution from the HTTP connection:

```python
agent_server = LongRunningAgentServer(
    "ResponsesAgent",
    enable_chat_proxy=True,
    db_instance_name="agent-forge-lakebase",
    task_timeout_seconds=3600,   # 1 hour max
    poll_interval_seconds=1.0,
)
```

### How it works

1. Client sends request -> server returns immediately with task ID
2. Agent runs in background, persists progress to Lakebase
3. Client polls for completion or uses resumable streaming with cursor
4. If connection drops, client reconnects with `starting_after=<sequence_number>` and picks up where it left off

### Tables created

- `responses` -- task status and metadata
- `messages` -- response message history

### Streaming modes

| Mode | How | Use case |
|------|-----|----------|
| **Direct stream** | SSE events as they arrive | Fast responses, simple queries |
| **Background poll** | POST -> get task ID -> poll GET | Slow operations, fire-and-forget |
| **Background stream** | POST -> get task ID -> stream with cursor | Long operations with live progress |
| **Resume** | Stream with `starting_after=N` | Reconnect after disconnect |

---

## Lakebase Setup

### Instance

One Lakebase instance serves all three features. Already wired as a setup block in the visual app:

- `LAKEBASE_INSTANCE_NAME` env var
- `data/init/create_lakebase.py` -- creates CU_1 instance
- Visual app: pick existing, create new, test, manual entry
- Test: `databricks database get-database-instance <name>` -> checks `AVAILABLE` state

### Table creation

On first startup, the agent server runs:

```python
async with AsyncCheckpointSaver(...) as checkpointer:
    await checkpointer.setup()  # creates checkpoint tables

async with AsyncDatabricksStore(...) as store:
    await store.setup()  # creates store tables
```

No manual DDL needed.

### Permissions (for deployed app)

The Databricks App service principal needs grants on the Lakebase schema:

```sql
-- Via grant_lakebase_permissions.py
GRANT USAGE, CREATE ON SCHEMA agent_memory TO <service_principal>;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA agent_memory TO <service_principal>;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA agent_memory TO <service_principal>;
```

---

## Implementation Changes

### agent/agent.py

- Add `AsyncCheckpointSaver` as checkpointer param to `create_agent()`
- Read `thread_id` from request, pass in `config["configurable"]["thread_id"]`
- If `user_id` available, add memory tools to tool list
- Memory tools created via factory (same pattern as `ka_factory.py`)

### agent/start_server.py

- Swap `AgentServer` for `LongRunningAgentServer`
- Add Lakebase config (instance name from `LAKEBASE_INSTANCE_NAME`)
- Startup lifespan runs `checkpointer.setup()` + `store.setup()`
- Graceful degradation if Lakebase unavailable

### app/server/ (Express API)

- Pass `thread_id` from frontend to agent backend in request body
- New endpoint: `GET /api/threads` -- list past conversations
- Handle async response pattern (poll/stream with task ID)

### app/client/ (React frontend)

- Generate `thread_id` per conversation, store in localStorage
- Conversation sidebar: list past threads, click to resume
- Reconnect logic for long-running responses
- "Processing..." indicator when task is running in background

### deploy/

- Lakebase resource in `databricks.yml` with `CAN_CONNECT_AND_CREATE`
- `grant_lakebase_permissions.py` script for SP table grants
- New env var: `LAKEBASE_AGENT_MEMORY_SCHEMA` (default: `agent_memory`)

### pyproject.toml

- Add `databricks-ai-bridge` dependency

### .forge schema

```yaml
agent:
  stateful: true           # enables short-term memory (checkpointing)
  long_term_memory: true   # enables long-term memory (user profiles)
  long_running: true       # enables background execution
```

---

## Testing

### Short-term memory

1. Start agent locally
2. Send a message ("My name is Alice")
3. Refresh page -- same thread_id loaded from localStorage
4. Send "What's my name?" -- agent should know

### Long-term memory

1. Conversation A: "Remember that I prefer window seats"
2. Start new conversation (new thread_id)
3. "What are my travel preferences?" -- agent should recall from long-term store

### Multi-user isolation (self-sufficient, no colleagues)

1. Create SP-A and SP-B in workspace (Account Console or SDK)
2. Generate tokens for each
3. Hit agent API with SP-A token -- "Remember I like morning flights"
4. Hit agent API with SP-B token -- "What do I prefer?" -- should know nothing
5. Hit with SP-A again -- "What do I prefer?" -- should recall morning flights

All via curl or test script, zero humans needed.

### Long-running execution

1. Trigger a complex multi-tool chain (e.g. query + KA + action)
2. Verify response streams without timeout
3. Kill browser tab during execution
4. Reconnect -- response should resume from where it left off

---

## What doesn't change

- Tool definitions, prompts, data layer, Genie/KA/VS wiring -- all untouched
- Stateful is a framework feature, not a domain feature
- The `.forge` stash system is independent of memory
