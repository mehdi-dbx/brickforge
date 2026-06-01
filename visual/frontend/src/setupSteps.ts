import type { SetupStep } from './types'

export const SETUP_STEPS: SetupStep[] = [
  {
    id: 'host',
    label: 'workspace',
    title: 'Workspace connection',
    help: 'Connect to the Databricks workspace where your agent will run. Bridge-forge authenticates via browser and creates a 7-day PAT automatically. Or enter the workspace URL and token manually. The token is used for all API calls: provisioning resources, deploying the app, and running queries.',
    choices: [
      { title: 'connect via bridge-forge', desc: 'authenticate and set up host + token in one step (recommended)', action: 'forge-bridge' },
      { title: 'enter manually',     desc: 'paste workspace URL and token',                  action: 'manual' },
    ],
  },
  {
    id: 'warehouse',
    label: 'sql warehouse',
    title: 'Databricks warehouse id',
    help: 'The SQL warehouse used by the agent to execute queries against Unity Catalog tables and stored procedures. Pick a running warehouse; serverless or pro warehouses both work.',
    choices: [
      { title: 'pick from workspace', desc: 'list running warehouses and save selection', action: 'cfg-warehouse' },
      { title: 'enter id manually',   desc: 'paste a warehouse ID directly',            action: 'manual' },
    ],
  },
  {
    id: 'schema',
    label: 'unity catalog',
    title: 'Unity catalog schema',
    help: 'The Unity Catalog catalog.schema where all project assets will live -- Delta tables, SQL functions, stored procedures, and volumes. The catalog and schema will be created if they don\'t exist. This must be set before creating tables or uploading KA documents.',
    choices: [
      { title: 'pick existing catalog', desc: 'choose from catalogs available in this workspace',             action: 'cfg-catalog' },
      { title: 'enter manually',        desc: 'type catalog.schema directly',                                action: 'manual' },
    ],
  },
  {
    id: 'tables',
    label: 'data tables',
    title: 'Data tables',
    help: 'Provision Delta tables into the Unity Catalog schema. Choose a data source: use the shipped seed data, upload your own CSVs, generate synthetic data with AI, or connect tables that already exist in UC.',
    choices: [
      { title: 'use default data',       desc: 'provision from shipped seed CSVs (airops, flights, etc.)',          action: 'exec-tables' },
      { title: 'upload your own CSVs',    desc: 'upload CSV files and create Delta tables from them',               action: 'upload-csv' },
      { title: 'generate synthetic data', desc: 'open the data gen wizard to create tables with AI',                action: 'gen-data' },
      { title: 'connect existing tables', desc: 'point to tables already in Unity Catalog -- no creation needed',   action: 'connect-tables' },
      { title: 'skip',                    desc: 'no data tables needed right now',                                  action: 'done' },
    ],
  },
  {
    id: 'functions',
    label: 'UC functions',
    title: 'Functions & procedures',
    help: 'Create UC functions and stored procedures that the agent uses as tools. Functions are parameterized queries registered in Unity Catalog. Procedures are mutation operations (UPDATE, INSERT). Generate them from your table schemas or upload SQL files.',
    choices: [
      { title: 'provision existing',     desc: 'create functions + procedures from stash or previously generated SQL',  action: 'exec-functions' },
      { title: 'generate routines',      desc: 'open the routines wizard to generate functions from your tables with AI', action: 'gen-routines' },
      { title: 'upload SQL files',       desc: 'upload .sql files with CREATE FUNCTION / PROCEDURE statements',        action: 'upload-sql' },
      { title: 'skip',                   desc: 'no functions needed right now',                                         action: 'done' },
    ],
  },
  {
    id: 'model',
    label: 'model endpoint',
    title: 'Agent model endpoint',
    help: 'Pick the LLM endpoint your agent will use for reasoning. Auto-detect scans this workspace for available Foundation Model endpoints. Cross-workspace is for advanced setups where the endpoint lives on a different workspace.',
    choices: [
      { title: 'auto-detect',          desc: 'scan this workspace for FM endpoints and pick one',            action: 'cfg-model' },
      { title: 'cross-workspace',      desc: 'use an FM endpoint from a different workspace (advanced)',     action: 'cfg-profile' },
      { title: 'enter manually',       desc: 'paste an endpoint URL and token directly',                     action: 'manual' },
    ],
  },
  {
    id: 'prompt',
    label: 'agent prompt',
    title: 'Agent prompt',
    help: 'The system prompt defines the agent personality, response format, tool usage rules, and domain behavior. The knowledge base injects operational FAQ. Edit these files to adapt the agent to your domain.',
    choices: [
      { title: 'generate from domain', desc: 'describe your use case and generate all prompt files with AI', action: 'cfg-prompt-gen' },
      { title: 'view / edit prompts',  desc: 'open the prompt editor to review and modify prompt files',     action: 'cfg-prompt' },
    ],
  },
  {
    id: 'genie',
    label: 'genie space',
    title: 'Genie space',
    help: 'A Databricks Genie space that the agent uses for natural-language-to-SQL queries via MCP. The Genie space is bound to your project tables and lets the agent answer ad-hoc data questions. Create a new room or pick an existing one.',
    choices: [
      { title: 'pick existing space', desc: 'list genie spaces and save selection',              action: 'cfg-genie' },
      { title: 'create new room',     desc: 'provision a new genie room with a name',            action: 'exec-genie' },
      { title: 'enter id manually',   desc: 'paste a genie space ID directly',                   action: 'manual' },
    ],
  },
  {
    id: 'ka',
    label: 'knowledge assistant',
    title: 'Knowledge assistant',
    help: 'A Knowledge Assistant endpoint backed by your documents. It ingests PDFs into a vector index and exposes a retrieval-augmented endpoint the agent calls to answer questions with cited sources.',
    choices: [
      { title: 'provision from pdfs', desc: 'upload PDFs to volume, then create KA endpoint',     action: 'cfg-ka' },
      { title: 'enter id manually',   desc: 'paste a KA endpoint name directly',                 action: 'manual' },
    ],
  },
  {
    id: 'vs',
    label: 'vector search',
    title: 'Vector search index',
    help: 'A Databricks Vector Search index the agent uses via MCP for semantic document retrieval. Serves as a fallback or complement to Knowledge Assistants. Specify the full three-level index path: catalog.schema.index_name.',
    choices: [
      { title: 'enter index path',  desc: 'paste a vector search index path',      action: 'manual' },
    ],
  },
  {
    id: 'mcp',
    label: 'MCP (external)',
    title: 'External MCP servers',
    help: 'Connect external MCP servers to give the agent additional tools (weather APIs, Slack, custom services, etc.). Each server is identified by its streamable HTTP URL. Optional auth headers can be configured per server.',
    choices: [
      { title: 'add MCP server',    desc: 'enter a server URL and optional auth header',   action: 'manual' },
    ],
  },
  {
    id: 'api',
    label: 'API (external)',
    title: 'External API connections',
    help: 'Add external REST APIs as agent tools. Two modes: UC Connection (governed, credentials in Databricks) or Direct HTTP (API key in env var). Each API becomes a callable tool the agent can invoke. Configure URL, method, path, params, and auth.',
    choices: [
      { title: 'add UC connection API',  desc: 'create a UC HTTP connection and register as tool',   action: 'cfg-api-uc' },
      { title: 'add direct HTTP API',    desc: 'enter a URL and optional API key header',             action: 'cfg-api-direct' },
    ],
  },
  {
    id: 'a2a',
    label: 'A2A (agents)',
    title: 'Agent-to-Agent connections',
    help: 'Connect to remote agents via Google\'s A2A (Agent-to-Agent) protocol. Enables your agent to delegate tasks to or collaborate with other agents over HTTP. Each A2A connection is identified by the remote agent\'s URL. The agent discovers capabilities via the Agent Card.',
    choices: [
      { title: 'add A2A agent',     desc: 'enter a remote agent URL and optional auth header',   action: 'manual' },
    ],
  },
  {
    id: 'features',
    label: 'features',
    title: 'Agent features',
    help: 'Toggle optional agent capabilities on or off. Each feature adds a tool or behavior to the agent. Disabled features are not loaded at startup.',
    choices: [
      { title: 'manage features', desc: 'view and toggle available agent features', action: 'cfg-features' },
    ],
  },
  {
    id: 'lakebase',
    label: 'lakebase',
    title: 'Lakebase instance',
    help: 'A managed Postgres (Lakebase) instance used by the agent for stateful conversation checkpointing and long-term memory. The instance is created with CU_1 capacity and takes a few minutes to become available.',
    choices: [
      { title: 'pick existing',       desc: 'list Lakebase instances and save selection',         action: 'cfg-lakebase' },
      { title: 'create instance',     desc: 'provision a new Lakebase instance (CU_1, ~5 min)',   action: 'exec-lakebase' },
      { title: 'enter name manually', desc: 'paste an existing Lakebase instance name',           action: 'manual' },
    ],
  },
  {
    id: 'mlflow',
    label: 'mlflow experiment',
    title: 'Mlflow experiment id',
    help: 'An MLflow experiment for tracking agent evaluation runs. The eval pipeline runs baseline vs with-guideline comparisons using a custom Claude-based LLM judge scorer, and logs results here for comparison in the MLflow UI.',
    choices: [
      { title: 'create new experiment', desc: 'provision MLflow experiment automatically',        action: 'exec-mlflow' },
      { title: 'enter id manually',     desc: 'paste an experiment ID directly',                  action: 'manual' },
    ],
  },
  {
    id: 'grants',
    label: 'app grants',
    title: 'Run all grants',
    help: 'Grants UC permissions to the Databricks App service principal so the deployed app can access tables, execute stored procedures, and use the SQL warehouse. Run this after deploying the app -- the service principal is created at deploy time.',
    choices: [
      { title: 'run grant script', desc: 'apply all UC permissions automatically',               action: 'exec-grants' },
      { title: 'view issues',      desc: 'see which grants are missing',                         action: 'cfg-grants' },
    ],
  },
  {
    id: 'deploy',
    label: 'deploy app',
    title: 'Dbx app name / deploy',
    help: 'Deploy the agent to Databricks Apps using the DAB bundle pipeline. Runs 7 stages: env validation, config sync (.env.local to databricks.yml), pre-flight checks (imports, bundle validate, model test), bundle deploy, service principal setup, UC grants, and app URL retrieval. Use "dry run" to validate without deploying.',
    choices: [
      { title: 'deploy now',     desc: 'bundle agent + chat UI, upload to workspace, deploy as Databricks App',         action: 'exec-deploy-agent' },
      { title: 'set app name',   desc: 'configure DBX_APP_NAME before deploying',                                       action: 'cfg-deploy-name' },
      { title: 'skip',           desc: 'skip deployment for now',                                                        action: 'done' },
    ],
  },
  {
    id: 'git',
    label: 'source control',
    title: 'Push to Git',
    help: 'Push your agent project to a GitHub or GitLab repository. Uses Databricks-stored git credentials -- no PAT entry needed. The Setup App creates a Databricks Git Folder linked to your repo, writes the project files, and commits+pushes automatically.',
    choices: [
      { title: 'push to GitHub',  desc: 'push project to a GitHub repo (uses Databricks git credentials)',  action: 'cfg-git' },
      { title: 'push to GitLab',  desc: 'push project to a GitLab repo',                                    action: 'cfg-git' },
      { title: 'skip',            desc: 'no source control for now',                                         action: 'done' },
    ],
  },
]
