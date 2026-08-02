#!/usr/bin/env bash
# Fast-forward /opt/airplane-frame to origin/main; optional npm ci + worker restart.
# Intended for root-owned systemd timer. Never prints secret values.
set -euo pipefail

REPO_ROOT="${AIRPLANE_FRAME_ROOT:-/opt/airplane-frame}"
SERVICE_USER="${AIRPLANE_FRAME_USER:-airplane-frame}"
SERVICE_NAME="${AIRPLANE_FRAME_SERVICE:-airplane-frame-worker.service}"
DRY_RUN=0

usage() {
  echo "usage: $0 [--dry-run]" >&2
  exit 2
}

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) usage ;;
    *) echo "pi-sync: unknown argument: $arg" >&2; usage ;;
  esac
done

log() {
  echo "pi-sync: $*"
}

die() {
  echo "pi-sync: ERROR: $*" >&2
  exit 1
}

as_service_user() {
  if [[ "$(id -u)" -eq 0 ]]; then
    runuser -u "$SERVICE_USER" -- "$@"
  else
    "$@"
  fi
}

[[ -d "$REPO_ROOT/.git" ]] || die "not a git checkout: $REPO_ROOT"

cd "$REPO_ROOT"

as_service_user git fetch --quiet origin main

local_sha="$(as_service_user git rev-parse HEAD)"
remote_sha="$(as_service_user git rev-parse origin/main)"

if [[ "$local_sha" == "$remote_sha" ]]; then
  log "already-current ${local_sha:0:12}"
  exit 0
fi

merge_base="$(as_service_user git merge-base HEAD origin/main)"
if [[ "$merge_base" != "$local_sha" ]]; then
  die "refusing non-fast-forward update (HEAD=${local_sha:0:12} origin/main=${remote_sha:0:12})"
fi

changed="$(as_service_user git diff --name-only "$local_sha" "$remote_sha" || true)"
needs_npm=0
needs_restart=0

if printf '%s\n' "$changed" | grep -qx 'worker/package.json' \
  || printf '%s\n' "$changed" | grep -qx 'worker/package-lock.json'; then
  needs_npm=1
fi

if printf '%s\n' "$changed" | grep -q '^worker/'; then
  needs_restart=1
fi

actions=()
actions+=("ff-only ${local_sha:0:12}→${remote_sha:0:12}")
[[ "$needs_npm" -eq 1 ]] && actions+=("npm-ci")
[[ "$needs_restart" -eq 1 ]] && actions+=("restart ${SERVICE_NAME}")

if [[ "$DRY_RUN" -eq 1 ]]; then
  log "dry-run would: $(IFS=', '; echo "${actions[*]}")"
  exit 0
fi

as_service_user git merge --ff-only --quiet origin/main

if [[ "$needs_npm" -eq 1 ]]; then
  as_service_user npm --prefix "$REPO_ROOT/worker" ci --omit=dev
fi

if [[ "$needs_restart" -eq 1 ]]; then
  if [[ "$(id -u)" -eq 0 ]]; then
    systemctl restart "$SERVICE_NAME"
  else
    die "worker/ changed but not root; cannot restart ${SERVICE_NAME}"
  fi
fi

log "updated $(IFS=', '; echo "${actions[*]}")"
exit 0
