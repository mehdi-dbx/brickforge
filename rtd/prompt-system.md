# Prompt System

The agent's behavior is defined by three files, all project-scoped.

## Components

### System prompt (`main.prompt`)

The primary instruction set for the agent. Contains:

- Role definition and personality
- Available tool descriptions and usage patterns
- Response formatting rules
- Domain-specific instructions
- The `KNOWLEDGE_BASE` placeholder (replaced at runtime)

Location: `projects/{name}/prompt/main.prompt`

### Knowledge base (`knowledge.base`)

Domain-specific facts, rules, and reference data injected into the system prompt at runtime. This is where you put business logic the agent needs to know.

Location: `projects/{name}/prompt/knowledge.base`

### User prompt

The per-turn user message. Handled by the chat UI - not a file you edit.

## How KNOWLEDGE_BASE injection works

At agent startup, `brickforge/agent/agent.py`:

1. Reads `main.prompt` from the project prompt directory
2. Reads `knowledge.base` from the same directory
3. Replaces the literal string `KNOWLEDGE_BASE` in the system prompt with the knowledge base content
4. Passes the assembled prompt to the LangGraph agent

```
main.prompt (with KNOWLEDGE_BASE placeholder)
    +
knowledge.base (domain facts)
    =
Final system prompt (sent to LLM)
```

## Generating prompts with AI

The **Agent Prompt** setup block offers a "Generate from domain" option:

1. BrickForge sends your table schemas, function signatures, and domain description to the LLM
2. The LLM generates a tailored system prompt and knowledge base
3. Files are written to `projects/{name}/prompt/`
4. You can review and edit before deploying

Source: `brickforge/data/gen/prompt_generator.py`

## Editing manually

The setup block also provides a text editor for direct editing of both files. Changes are saved to the project prompt directory immediately.

## Project scoping

Prompts are fully project-scoped:

- Each project has its own `prompt/` directory under `projects/{name}/prompt/`
- Switching projects switches the active prompt
- Exporting a `.forge.zip` bundle includes the prompt files
- No fallback to shared/default prompts when a project directory is set

!!! tip
    Keep the knowledge base factual and concise. The agent performs better with structured reference data (tables, lists, rules) than with long prose passages.

## Prompt at deploy time

When deploying, the prompt files are included in the agent bundle:

1. `build_agent_bundle()` copies `projects/{name}/prompt/` into the bundle
2. On Databricks Apps, `start_server.py` reads prompts from the bundle path
3. The `PROJECT_DIR` env var points to the project directory inside the bundle
