# BrickForge -- Git History & Checkpoints

## Branches

| Branch | Purpose | Status |
|--------|---------|--------|
| `main` | Stable release (pre-SaaS, with airops domain) | Frozen at `1acb510` |
| `legacy` | Snapshot of main before SaaS work | Frozen at `1acb510` |
| `forge-saas-databricks` | SaaS transformation branch | **Active** |
| `visual` | Visual app development (merged into main) | Archived |

## Tags

| Tag | Commit | Description |
|-----|--------|-------------|
| `pre-saas-transition` | `0b13a3b` | Clean framework, domain extraction complete. Last commit before SaaS architecture begins. |

## Key Milestones (chronological)

### Foundation (oldest to newest)

| Commit | What |
|--------|------|
| `9a2ba8c` | Initial commit |
| `a50faf5` | Data directory structure |
| `76eee5f` | Claude Code skills |
| `595af26` | Scripts directory with init and quickstart |
| `95ad9b6` | Complete deploy pipeline, remove AMADEUS hardcoded references |
| `5881da4` | Fix backend import chain, add all tool files |

### Agent & Deploy Hardening

| Commit | What |
|--------|------|
| `dac2560` | Fix cross-workspace LLM auth, guardrail streaming, deploy automation |
| `d274766` | Build client remotely at app startup (no pre-build) |
| `581c3d7` | Deploy: detect workspace switch, clear stale bundle state |
| `7cdd54c` | Harden deploy: fix endpoint grants, SP auth, host mismatch |
| `5606be7` | Harden setup for workspace switching: validate resources |

### Knowledge & Tools

| Commit | What |
|--------|------|
| `5e3340c` | Vector Search as KA fallback: provisioning, agent MCP integration |
| `fc84dd2` | Replace VS with KA in Vocareum bundle, Genie perms API |
| `a85094f` | Airport ops tools, SQL functions/procedures |

### Visual App & Rebrand

| Commit | What |
|--------|------|
| `5e8c582` | Rebrand to BrickForge, add edu slides, visual app features, data gen, cleanup |
| `ab131a7` | README with BrickForge logo, HTML architecture flow |
| `149f56d` | Real SVG logo, architecture flow, bricks visuals with dark/light mode |
| `63c0997` | Consolidate docs into single BrickForge getting started guide |
| `65dc71d` | Pre-build visual app for zero-install startup (node-only, no npm) |

### Multi-Instance & Domain Extraction

| Commit | What |
|--------|------|
| `1acb510` | Multi-instance Genie/KA/VS with enable/disable toggles and add buttons |
| `eb3b952` | Gitignore generated data -- remove vehicle rental files |
| **`0b13a3b`** | **CHECKPOINT: Domain extraction complete -- framework is domain-agnostic** |

## How to Navigate

```bash
# Return to pre-SaaS clean framework
git checkout pre-saas-transition

# Return to last stable release with airops domain
git checkout legacy

# Return to current SaaS development
git checkout forge-saas-databricks
```
