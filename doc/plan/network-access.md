# Network Access Setup for EC2 Dev Box

## Context

Brickforge running on an EC2 instance in `aws-field-eng` needs to reach the Databricks workspace `e2-demo-field-eng.cloud.databricks.com`. The workspace has IP ACL enabled, which blocks requests from unknown IPs.

## Problem

The EC2 instance IP (`18.236.159.7`) was blocked by the workspace IP ACL:

```
databricks.sdk.errors.platform.PermissionDenied: Source IP address: 18.236.159.7 is blocked by Databricks IP ACL for workspace: 1444828305810485
```

## Solution

Added the EC2 public IP to the workspace IP Access List via Databricks CLI:

```bash
databricks ip-access-lists create \
  --json '{"label": "EC2 Devbox", "list_type": "ALLOW", "ip_addresses": ["18.236.159.7/32"]}' \
  --profile e2-demo-field-eng
```

### Gotcha: Local IP also blocked

Running this command from home wifi failed because the local IP (`88.168.136.111`) was also not whitelisted. Had to **turn VPN on** first (VPN IP is whitelisted), then run the command.

## IP ACL Entry Details

| Field | Value |
|-------|-------|
| **Label** | `EC2 Devbox` |
| **List ID** | `e8afc493-1cc6-4038-9128-e8fc2dd5d590` |
| **IP** | `18.236.159.7/32` |
| **List Type** | ALLOW |
| **Workspace** | `e2-demo-field-eng.cloud.databricks.com` (ID: `1444828305810485`) |
| **Account ID** | `e6e8162c-a42f-43a0-af86-312058795a14` |

## Important Notes

- **EC2 public IP changes on stop/start.** If the instance is stopped and restarted, the new IP must be added to the ACL and the old one removed:
  ```bash
  # Remove old
  databricks ip-access-lists delete e8afc493-1cc6-4038-9128-e8fc2dd5d590 --profile e2-demo-field-eng

  # Get new IP
  aws ec2 describe-instances --instance-ids i-0780e67fa7c559a77 --profile aws-field-eng_databricks-power-user --region us-west-2 --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

  # Add new
  databricks ip-access-lists create --json '{"label": "EC2 Devbox", "list_type": "ALLOW", "ip_addresses": ["NEW_IP/32"]}' --profile e2-demo-field-eng
  ```
- **VPN required** to manage IP ACLs from local machine (home IP not whitelisted).
- The `aws-field-eng` account has a **security guardrail** that auto-strips `0.0.0.0/0` SSH security group rules. SG rules must be scoped to a specific IP (e.g. `88.168.136.111/32`).
