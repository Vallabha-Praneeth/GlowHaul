#!/usr/bin/env bash
set -euo pipefail

OUTPUT_FILE="${1:-${GITHUB_ENV:-}}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
SUPABASE_DIR="${REPO_ROOT}/packages/supabase"

if [[ -z "${OUTPUT_FILE}" ]]; then
  echo "Provide an output file path or set GITHUB_ENV." >&2
  exit 1
fi

if [[ ! -f "${SUPABASE_DIR}/supabase/config.toml" ]]; then
  echo "Could not find Supabase config at ${SUPABASE_DIR}/supabase/config.toml." >&2
  exit 1
fi

mkdir -p "$(dirname "${OUTPUT_FILE}")"
touch "${OUTPUT_FILE}"

strip_quotes() {
  local value="$1"
  value="${value%\"}"
  value="${value#\"}"
  printf '%s' "${value}"
}

status_env="$(cd "${SUPABASE_DIR}" && supabase status -o env)"

api_url=""
anon_key=""
service_role_key=""

while IFS='=' read -r key raw_value; do
  [[ -z "${key}" ]] && continue
  value="$(strip_quotes "${raw_value}")"

  case "${key}" in
    API_URL)
      api_url="${value}"
      ;;
    ANON_KEY)
      anon_key="${value}"
      ;;
    SERVICE_ROLE_KEY)
      service_role_key="${value}"
      ;;
  esac
done <<< "${status_env}"

if [[ -z "${api_url}" || -z "${anon_key}" || -z "${service_role_key}" ]]; then
  echo "Failed to extract local Supabase API URL, anon key, or service role key." >&2
  exit 1
fi

{
  echo "NEXT_PUBLIC_APP_NAME=GlowHaul"
  echo "NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100"
  echo "PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100"
  echo "NEXT_PUBLIC_SUPABASE_URL=${api_url}"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon_key}"
  echo "SUPABASE_SERVICE_ROLE_KEY=${service_role_key}"
  echo "AUTH_ENFORCE_ROUTE_GUARDS=true"
  echo "AUTH_PRIMARY_METHOD=magic-link"
  echo "AUTH_PHONE_OTP_ENABLED=false"
  echo "AUTH_PHONE_OTP_PLACEHOLDER=+15555550123"
  echo "AUTH_PHONE_OTP_LENGTH=6"
  echo "AUTH_PHONE_OTP_EXPIRES_IN_SECONDS=60"
  echo "NEXT_PUBLIC_MAP_PROVIDER=maplibre"
  echo "NEXT_PUBLIC_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json"
} >> "${OUTPUT_FILE}"
