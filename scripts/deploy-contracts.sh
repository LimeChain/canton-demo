#!/usr/bin/env bash
set -euo pipefail

# This sctipt:
# 1. uploads the already built contract DAR to all involved participants
# 2. executes a Daml Script
# (which automates the parties allocation and creates initial BankAccount contracts)
# 3. it stores the created parties in .demo/parties.json

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACTS_IMAGE="${CONTRACTS_IMAGE:-canton-demo-contracts:3.5.1}"
PARTIES_FILE="${ROOT_DIR}/.demo/parties.json"
CONTRACT_DAR="/workspace/contracts/daml/.daml/dist/canton-demo-money-0.1.0.dar"
SCRIPT_DAR="/workspace/scripts/daml/.daml/dist/canton-demo-money-scripts-0.1.0.dar"
CANTON_CONSOLE_CONFIG="/workspace/config/canton-console-participants.conf"
PARTICIPANTS_CONFIG="/workspace/config/daml-script-participants.json"

mkdir -p "${ROOT_DIR}/.demo"

network="$(
  docker inspect canton-demo-pqs-postgres \
    --format '{{range $name, $_ := .NetworkSettings.Networks}}{{println $name}}{{end}}' \
    2>/dev/null \
    | sed -n '1p'
)" || true

if [[ -z "${network}" ]]; then
  echo "Canton demo infra is not running. Run: make start-infra" >&2
  exit 1
fi

run_contracts() {
  docker run --rm -i \
    --network "${network}" \
    --user "$(id -u):$(id -g)" \
    -e HOME=/tmp \
    -v "${ROOT_DIR}:/workspace" \
    -w /workspace \
    "${CONTRACTS_IMAGE}" \
    "$@"
}

upload_contract_dars() {
  run_contracts sh -s -- "${CONTRACT_DAR}" "${CANTON_CONSOLE_CONFIG}" <<'SCRIPT'
set -euo pipefail

dar_path="$1"
console_config="$2"
console_script="$(mktemp)"

trap 'rm -f "${console_script}"' EXIT

cat > "${console_script}" <<EOF
val dar = "${dar_path}"
bank.dars.upload(dar)
users.dars.upload(dar)
observer.dars.upload(dar)
EOF

dpm canton-console \
  --no-tty \
  -c "${console_config}" \
  --bootstrap "${console_script}"
SCRIPT
}

upload_contract_dars

script_name="DemoMoneyDeploy:allocateAndSetup"
party_file_arg=(--output-file /workspace/.demo/parties.json)

if [[ -f "${PARTIES_FILE}" ]]; then
  script_name="DemoMoneyDeploy:setupInitialState"
  party_file_arg=(--input-file /workspace/.demo/parties.json)
fi

run_contracts dpm script \
  --dar "${SCRIPT_DAR}" \
  --script-name "${script_name}" \
  --participant-config "${PARTICIPANTS_CONFIG}" \
  --upload-dar no \
  "${party_file_arg[@]}"

echo "Contracts deployed. Demo parties stored in .demo/parties.json."
