import type { SetupStep } from './types'

export const SETUP_STEPS: SetupStep[] = [
  {
    id: 'host',
    label: 'databricks host',
    title: 'Databricks host',
    help: 'The Databricks workspace URL where your agent will run. This is the base URL for all API calls, CLI commands, and resource provisioning. If you have multiple workspaces, pick the one intended for this project.',
    choices: [
      { title: 'keep current',       desc: 'use host already set in .env.local',              action: 'done' },
      { title: 'use existing CLI profile', desc: 'pick from detected workspace profiles and save host automatically', action: 'cfg-profile' },
      { title: 'set up new workspace', desc: 'authenticate and configure a new workspace',     action: 'cfg-new' },
      { title: 'enter manually',     desc: 'paste a workspace URL directly',                  action: 'manual' },
    ],
  },
  {
    id: 'auth',
    label: 'authentication',
    title: 'Databricks token / profile',
    help: 'Authentication credentials for the Databricks CLI and API. A personal access token (PAT) or CLI profile is required to provision resources, deploy the app, and run queries. PATs expire after 7 days by default -- regenerate when switching workspaces.',
    choices: [
      { title: 'keep current',         desc: 'use token already set in .env.local',                action: 'done' },
      { title: 'generate 7-day PAT',   desc: 'create a personal access token from current profile', action: 'exec-pat' },
      { title: 'enter token manually', desc: 'paste a dapi... token directly',                     action: 'manual' },
    ],
  },
  {
    id: 'warehouse',
    label: 'sql warehouse',
    title: 'Databricks warehouse id',
    help: 'The SQL warehouse used by the agent to execute queries against Unity Catalog tables -- flight data, check-in metrics, and stored procedures all run here. Pick a running warehouse; serverless or pro warehouses both work.',
    choices: [
      { title: 'keep current',        desc: 'use warehouse already set in .env.local', action: 'done' },
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
      { title: 'keep current',          desc: 'use schema already set in .env.local',                        action: 'done' },
      { title: 'enter manually',        desc: 'type catalog.schema directly',                                action: 'manual' },
    ],
  },
  {
    id: 'tables',
    label: 'data tables',
    title: 'Data tables',
    help: 'Provision Delta tables from the data layer into the Unity Catalog schema. Uses default and/or generated data based on USE_DEFAULT_DATA / USE_GEN_DATA flags. Requires a valid Unity Catalog schema to be set first.',
    choices: [
      { title: 'provision tables',      desc: 'create catalog, schema, and Delta tables from CSV data',            action: 'exec-tables' },
      { title: 'keep current',          desc: 'tables already exist in the schema',                                action: 'done' },
    ],
  },
  {
    id: 'functions',
    label: 'UC functions',
    title: 'Functions & procedures',
    help: 'Create SQL functions and stored procedures in Unity Catalog. Uses default routines from data/default/func + data/default/proc and any generated routines from data/gen/func + data/gen/proc. These are the query templates and mutation operations the agent calls via tools.',
    choices: [
      { title: 'create all',           desc: 'provision functions and procedures from default + generated SQL',     action: 'exec-functions' },
      { title: 'keep current',          desc: 'routines already exist in the schema',                              action: 'done' },
    ],
  },
  {
    id: 'model',
    label: 'model endpoint',
    title: 'Agent model endpoint',
    help: 'The Foundation Model API endpoint the agent uses for LLM reasoning (Claude via Databricks model serving). If the FM endpoint is in the same workspace, no extra token is needed. For cross-workspace setups, a separate profile and PAT will be generated automatically.',
    choices: [
      { title: 'same workspace',       desc: 'use this workspace auth -- no extra config needed',             action: 'exec-same' },
      { title: 'use existing profile',  desc: 'pick a CLI profile for FM workspace, auto-generate PAT',      action: 'cfg-profile' },
      { title: 'set up new workspace', desc: 'authenticate a new FM workspace and generate credentials',     action: 'cfg-new' },
      { title: 'keep current',         desc: 'keep endpoint already set in .env.local',                      action: 'done' },
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
      { title: 'keep current',         desc: 'leave prompt files as-is',                                     action: 'done' },
    ],
  },
  {
    id: 'genie',
    label: 'genie space',
    title: 'Project genie checkin',
    help: 'A Databricks Genie space that the agent uses for natural-language-to-SQL queries via MCP. The Genie space is bound to specific tables and lets the agent answer ad-hoc data questions without hardcoded SQL. Create a new room or pick an existing one.',
    choices: [
      { title: 'pick existing space', desc: 'list genie spaces and save selection',              action: 'cfg-genie' },
      { title: 'create new room',     desc: 'provision a new genie room with a name',            action: 'exec-genie' },
      { title: 'keep current',        desc: 'use space already set in .env.local',               action: 'done' },
      { title: 'enter id manually',   desc: 'paste a genie space ID directly',                   action: 'manual' },
    ],
  },
  {
    id: 'ka',
    label: 'knowledge assistant',
    title: 'Project ka passengers',
    help: 'The Knowledge Assistant endpoint for EU passenger rights (EC 261/2004). It ingests regulatory PDFs from data/pdf/ into a vector index and exposes a retrieval-augmented endpoint the agent calls to answer passenger rights questions with cited sources.',
    choices: [
      { title: 'provision from pdfs', desc: 'upload PDFs to volume, then create KA endpoint',     action: 'cfg-ka' },
      { title: 'keep current',        desc: 'use KA already set in .env.local',                  action: 'done' },
      { title: 'enter id manually',   desc: 'paste a KA endpoint name directly',                 action: 'manual' },
    ],
  },
  {
    id: 'mlflow',
    label: 'mlflow experiment',
    title: 'Mlflow experiment id',
    help: 'An MLflow experiment for tracking agent evaluation runs. The eval pipeline runs baseline vs with-guideline comparisons using a custom Claude-based LLM judge scorer, and logs results here for comparison in the MLflow UI.',
    choices: [
      { title: 'create new experiment', desc: 'provision MLflow experiment automatically',        action: 'exec-mlflow' },
      { title: 'keep current',          desc: 'use experiment already set in .env.local',         action: 'done' },
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
      { title: 'deploy now',     desc: 'run the full deploy pipeline (config sync, pre-flight, bundle deploy, grants)', action: 'exec-deploy' },
      { title: 'dry run',        desc: 'validate everything without deploying (pre-flight checks only)',                action: 'exec-deploy-dry' },
      { title: 'set app name',   desc: 'configure DBX_APP_NAME before deploying',                                       action: 'cfg-deploy-name' },
      { title: 'skip',           desc: 'skip deployment for now',                                                        action: 'done' },
    ],
  },
]
