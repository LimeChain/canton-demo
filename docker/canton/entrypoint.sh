#!/usr/bin/env bash
set -euo pipefail

config="${CANTON_CONFIG:-/config/canton.conf}"
args=("$@" "--config" "$config" "--no-tty" "--log-profile" "container")

if [[ -n "${CANTON_BOOTSTRAP:-}" ]]; then
  args+=("--bootstrap" "$CANTON_BOOTSTRAP")
fi

exec /canton/bin/canton "${args[@]}"
