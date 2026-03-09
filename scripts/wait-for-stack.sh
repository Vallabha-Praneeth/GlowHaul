#!/usr/bin/env bash
set -euo pipefail

APP_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3100}"
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-http://127.0.0.1:55421}"
TIMEOUT_SECONDS="${WAIT_FOR_STACK_TIMEOUT_SECONDS:-90}"

wait_for_url() {
  local url="$1"
  local label="$2"
  local deadline=$((SECONDS + TIMEOUT_SECONDS))

  until curl -sS -o /dev/null "$url"; do
    if (( SECONDS >= deadline )); then
      echo "Timed out waiting for ${label} at ${url}" >&2
      exit 1
    fi
    sleep 1
  done

  echo "${label} ready: ${url}"
}

wait_for_url "${APP_URL}" "Web app"
wait_for_url "${SUPABASE_URL}/auth/v1/health" "Supabase Auth"
