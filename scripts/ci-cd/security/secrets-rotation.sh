#!/bin/bash
# Secrets rotation script for HashiCorp Vault

SECRET_PATH="secret/data/myapp"
VAULT_ADDR="http://vault.sxc.codes"

# Authenticate with Vault (ensure VAULT_TOKEN is exported)
if [ -z "$VAULT_TOKEN" ]; then
  echo "VAULT_TOKEN environment variable is missing"
  exit 1
fi

# Rotate secrets
vault kv patch $SECRET_PATH \
  username="new_user_$(date +%s)" \
  password="P@ssw0rd$(date +%N)"

# Verify new secrets
vault kv get $SECRET_PATH

