# EC2 Dev Box

## Instance

| Field | Value |
|-------|-------|
| **Instance ID** | `i-0780e67fa7c559a77` |
| **Region** | `us-west-2` |
| **AWS Profile** | `aws-field-eng_databricks-power-user` |
| **SSO Session** | `aws-rnd-root` |
| **SSH Key** | `~/.ssh/mehdi-lamrani-devbox.pem` |
| **User** | `ec2-user` |
| **Target Workspace** | `e2-demo-field-eng.cloud.databricks.com` |
| **DBX CLI Profile** | `e2-demo` |

## Reconnect Runbook (IP changes on every stop/start)

### 1. AWS SSO login (if session expired)
```bash
aws sso login --sso-session aws-rnd-root
```

### 2. Check instance state
```bash
aws ec2 describe-instances \
  --profile aws-field-eng_databricks-power-user \
  --region us-west-2 \
  --instance-ids i-0780e67fa7c559a77 \
  --query "Reservations[].Instances[].[State.Name,PublicIpAddress]" \
  --output text
```

### 3. Start if stopped
```bash
aws ec2 start-instances \
  --profile aws-field-eng_databricks-power-user \
  --region us-west-2 \
  --instance-ids i-0780e67fa7c559a77
# Wait ~20s, then re-run step 2 to get the new IP
```

### 4. Update workspace IP ACL (VPN must be on)
```bash
# Find and delete old EC2 Devbox ACL entry
databricks ip-access-lists list --profile e2-demo | grep -E "EC2 Devbox|brickforge-"
# Delete by list ID (first column from above)
databricks ip-access-lists delete <OLD_LIST_ID> --profile e2-demo

# Add new IP
databricks ip-access-lists create \
  --json '{"label": "EC2 Devbox", "list_type": "ALLOW", "ip_addresses": ["<NEW_IP>/32"]}' \
  --profile e2-demo
```

### 5. SSH in
```bash
ssh -i ~/.ssh/mehdi-lamrani-devbox.pem ec2-user@<NEW_IP>
```

### 6. Start brickforge (with SSH tunnel for browser access)
```bash
ssh -i ~/.ssh/mehdi-lamrani-devbox.pem -L 9000:localhost:9000 ec2-user@<NEW_IP>
brickforge
```

### 7. Re-auth Databricks CLI (if expired)
```bash
databricks auth login --host https://e2-demo-field-eng.cloud.databricks.com --profile e2-demo
```

## Gotchas

- **IP ACL quota**: e2-demo workspace is near 1000 IP limit. Always delete old entries before adding new ones.
- **VPN required** to manage IP ACLs from local machine (home IP not whitelisted).
- **Security guardrail**: `aws-field-eng` auto-strips `0.0.0.0/0` SSH security group rules. SG rules must be scoped to a specific IP.
- **brickforge persists at `~/.brickforge/`**: `.env.local`, logs survive instance stop/start. Only the IP changes.
