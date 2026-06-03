import type { SetupStep } from './types'

export const SETUP_STEPS: SetupStep[] = [
  {
    id: 'host',
    label: 'Workspace',
    title: 'Workspace Connection',
    help: 'Connect to the Databricks workspace where your agent will run. Bridge-forge authenticates via browser and creates a 7-day PAT automatically. Or enter the workspace URL and token manually. The token is used for all API calls: provisioning resources, deploying the app, and running queries.',
    choices: [
      { title: 'Connect Via Bridge-Forge', desc: 'Authenticate And Set Up Host + Token In One Step (Recommended)', action: 'forge-bridge' },
      { title: 'Enter Manually',     desc: 'Paste Workspace URL And Token',                  action: 'manual' },
    ],
  },
  {
    id: 'warehouse',
    label: 'SQL Warehouse',
    title: 'Databricks Warehouse ID',
    help: 'The SQL warehouse used by the agent to execute queries against Unity Catalog tables and stored procedures. Pick a running warehouse; serverless or pro warehouses both work.',
    choices: [
      { title: 'Pick From Workspace', desc: 'List Running Warehouses And Save Selection', action: 'cfg-warehouse' },
      { title: 'Enter ID Manually',   desc: 'Paste A Warehouse ID Directly',            action: 'manual' },
    ],
  },
  {
    id: 'schema',
    label: 'Unity Catalog',
    title: 'Unity Catalog Schema',
    help: 'The Unity Catalog catalog.schema where all project assets will live -- Delta tables, SQL functions, stored procedures, and volumes. The catalog and schema will be created if they don\'t exist. This must be set before creating tables or uploading KA documents.',
    choices: [
      { title: 'Pick Existing Catalog', desc: 'Choose From Catalogs Available In This Workspace',             action: 'cfg-catalog' },
      { title: 'Enter Manually',        desc: 'Type Catalog.Schema Directly',                                action: 'manual' },
    ],
  },
  {
    id: 'tables',
    label: 'Data Tables',
    title: 'Data Tables',
    help: 'Provision Delta tables into the Unity Catalog schema. Choose a data source: use the shipped seed data, upload your own CSVs, generate synthetic data with AI, or connect tables that already exist in UC.',
    choices: [
      { title: 'Generate Synthetic Data', desc: 'Open The Data Gen Wizard To Create Tables With AI',                action: 'gen-data' },
      { title: 'Connect Existing Tables', desc: 'Point To Tables Already In Unity Catalog -- No Creation Needed',   action: 'connect-tables' },
      { title: 'Upload Your Own CSVs',    desc: 'Upload CSV Files And Create Delta Tables From Them',               action: 'upload-csv' },
      { title: 'Use Demo Data',           desc: 'Provision From Shipped Seed CSVs (Airops, Flights, Etc.)',          action: 'exec-tables' },
      { title: 'Skip',                    desc: 'No Data Tables Needed Right Now',                                  action: 'done' },
    ],
  },
  {
    id: 'functions',
    label: 'Functions',
    title: 'Functions & Procedures',
    help: 'Create UC functions and stored procedures that the agent uses as tools. Functions are parameterized queries registered in Unity Catalog. Procedures are mutation operations (UPDATE, INSERT). Generate them from your table schemas or upload SQL files.',
    choices: [
      { title: 'Generate Routines',      desc: 'Generate Functions From Your Tables With AI',                           action: 'gen-routines' },
      { title: 'Pick From Existing',     desc: 'Use Functions Already In Unity Catalog',                                action: 'exec-functions' },
      { title: 'Skip',                   desc: 'No Functions Needed Right Now',                                          action: 'done' },
    ],
  },
  {
    id: 'model',
    label: 'Model',
    title: 'Agent Model Endpoint',
    help: 'Pick the LLM endpoint your agent will use for reasoning. Auto-detect scans this workspace for available Foundation Model endpoints. Cross-workspace is for advanced setups where the endpoint lives on a different workspace.',
    choices: [
      { title: 'Auto-Detect',          desc: 'Scan This Workspace For FM Endpoints And Pick One',            action: 'cfg-model' },
      { title: 'Cross-Workspace',      desc: 'Use An FM Endpoint From A Different Workspace (Advanced)',     action: 'cfg-profile' },
      { title: 'Enter Manually',       desc: 'Paste An Endpoint URL And Token Directly',                     action: 'manual' },
    ],
  },
  {
    id: 'prompt',
    label: 'Agent Prompt',
    title: 'Agent Prompt',
    help: 'The system prompt defines the agent personality, response format, tool usage rules, and domain behavior. The knowledge base injects operational FAQ. Edit these files to adapt the agent to your domain.',
    choices: [
      { title: 'Generate From Domain', desc: 'Describe Your Use Case And Generate All Prompt Files With AI', action: 'cfg-prompt-gen' },
      { title: 'View / Edit Prompts',  desc: 'Open The Prompt Editor To Review And Modify Prompt Files',     action: 'cfg-prompt' },
    ],
  },
  {
    id: 'genie',
    label: 'Genie Space',
    title: 'Genie Space',
    help: 'A Databricks Genie space that the agent uses for natural-language-to-SQL queries via MCP. The Genie space is bound to your project tables and lets the agent answer ad-hoc data questions. Create a new room or pick an existing one.',
    choices: [
      { title: 'Pick Existing Space', desc: 'List Genie Spaces And Save Selection',              action: 'cfg-genie' },
      { title: 'Create New Room',     desc: 'Provision A New Genie Room With A Name',            action: 'exec-genie' },
      { title: 'Enter ID Manually',   desc: 'Paste A Genie Space ID Directly',                   action: 'manual' },
    ],
  },
  {
    id: 'bricks',
    label: 'Agent Bricks',
    title: 'Agent Bricks',
    help: 'Toggle optional AI building blocks on or off. Each brick adds a specialized capability to the agent. Disabled bricks are not loaded at startup.',
    choices: [
      { title: 'Manage Bricks', desc: 'View And Toggle Available Agent Bricks', action: 'cfg-bricks' },
    ],
  },
  {
    id: 'vs',
    label: 'Vector Search',
    title: 'Vector Search Index',
    help: 'A Databricks Vector Search index the agent uses via MCP for semantic document retrieval. Serves as a fallback or complement to Knowledge Assistants. Specify the full three-level index path: catalog.schema.index_name.',
    choices: [
      { title: 'Enter Index Path',  desc: 'Paste A Vector Search Index Path',      action: 'manual' },
    ],
  },
  {
    id: 'mcp',
    label: 'MCP (External)',
    title: 'External MCP Servers',
    help: 'Connect external MCP servers to give the agent additional tools (weather APIs, Slack, custom services, etc.). Each server is identified by its streamable HTTP URL. Optional auth headers can be configured per server.',
    choices: [
      { title: 'Add MCP Server',    desc: 'Enter A Server URL And Optional Auth Header',   action: 'manual' },
    ],
  },
  {
    id: 'api',
    label: 'API (External)',
    title: 'External API Connections',
    help: 'Add external REST APIs as agent tools. Two modes: UC Connection (governed, credentials in Databricks) or Direct HTTP (API key in env var). Each API becomes a callable tool the agent can invoke. Configure URL, method, path, params, and auth.',
    choices: [
      { title: 'Add UC Connection API',  desc: 'Create A UC HTTP Connection And Register As Tool',   action: 'cfg-api-uc' },
      { title: 'Add Direct HTTP API',    desc: 'Enter A URL And Optional API Key Header',             action: 'cfg-api-direct' },
    ],
  },
  {
    id: 'a2a',
    label: 'A2A (Agents)',
    title: 'Agent-To-Agent Connections',
    help: 'Connect to remote agents via Google\'s A2A (Agent-to-Agent) protocol. Enables your agent to delegate tasks to or collaborate with other agents over HTTP. Each A2A connection is identified by the remote agent\'s URL. The agent discovers capabilities via the Agent Card.',
    choices: [
      { title: 'Add A2A Agent',     desc: 'Enter A Remote Agent URL And Optional Auth Header',   action: 'manual' },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    title: 'Agent Features',
    help: 'Toggle optional agent capabilities on or off. Each feature adds a tool or behavior to the agent. Disabled features are not loaded at startup.',
    choices: [
      { title: 'Manage Features', desc: 'View And Toggle Available Agent Features', action: 'cfg-features' },
    ],
  },
  {
    id: 'mlflow',
    label: 'MLflow Experiment',
    title: 'MLflow Experiment ID',
    help: 'An MLflow experiment for tracking agent evaluation runs. The eval pipeline runs baseline vs with-guideline comparisons using a custom Claude-based LLM judge scorer, and logs results here for comparison in the MLflow UI.',
    choices: [
      { title: 'Pick Existing',         desc: 'List MLflow Experiments And Save Selection',       action: 'cfg-mlflow' },
      { title: 'Create New Experiment', desc: 'Provision MLflow Experiment Automatically',        action: 'exec-mlflow' },
      { title: 'Enter ID Manually',     desc: 'Paste An Experiment ID Directly',                  action: 'manual' },
    ],
  },
  {
    id: 'deploy',
    label: 'Deploy App',
    title: 'DBX App Name / Deploy',
    help: 'Deploy the agent app to Databricks. Bundles code + config.json, uploads, deploys, then automatically runs all UC grants (tables, functions, warehouse, endpoints, genie, lakebase) for the app service principal.',
    choices: [
      { title: 'Set App Name',   desc: 'Configure DBX_APP_NAME Before Deploying',                                       action: 'cfg-deploy-name' },
      { title: 'Deploy Now',     desc: 'Bundle Agent + Chat UI, Upload To Workspace, Deploy As Databricks App',         action: 'exec-deploy-agent' },
    ],
  },
  {
    id: 'git',
    label: 'Source Control',
    title: 'Push To Git',
    help: 'Push your agent project to a GitHub or GitLab repository. Uses Databricks-stored git credentials -- no PAT entry needed. The Setup App creates a Databricks Git Folder linked to your repo, writes the project files, and commits+pushes automatically.',
    choices: [
      { title: 'Push To GitHub',  desc: 'Push Project To A GitHub Repo (Uses Databricks Git Credentials)',  action: 'cfg-git' },
      { title: 'Push To GitLab',  desc: 'Push Project To A GitLab Repo',                                    action: 'cfg-git' },
      { title: 'Skip',            desc: 'No Source Control For Now',                                         action: 'done' },
    ],
  },
]
