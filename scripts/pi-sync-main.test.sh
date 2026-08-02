#!/usr/bin/env bash
# Exercises pi-sync-main.sh against a disposable git checkout (no real remote / systemd).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$ROOT/scripts/pi-sync-main.sh"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/pi-sync-test.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

bin="$TMP/bin"
mkdir -p "$bin"
# Stub runuser so non-root hosts still exercise the root path when we fake uid... we don't.
# Script uses runuser only when uid=0; tests run as normal user.

cat >"$bin/systemctl" <<'EOF'
#!/usr/bin/env bash
echo "systemctl $*" >>"${PI_SYNC_SYSTEMCTL_LOG:?}"
EOF
chmod +x "$bin/systemctl"

cat >"$bin/npm" <<'EOF'
#!/usr/bin/env bash
echo "npm $*" >>"${PI_SYNC_NPM_LOG:?}"
EOF
chmod +x "$bin/npm"

export PATH="$bin:$PATH"
export PI_SYNC_SYSTEMCTL_LOG="$TMP/systemctl.log"
export PI_SYNC_NPM_LOG="$TMP/npm.log"
: >"$PI_SYNC_SYSTEMCTL_LOG"
: >"$PI_SYNC_NPM_LOG"

bare="$TMP/bare.git"
work="$TMP/work"
git init --bare "$bare" >/dev/null
git -C "$bare" symbolic-ref HEAD refs/heads/main
git clone "$bare" "$work" >/dev/null 2>&1
cd "$work"
git config user.email "test@example.com"
git config user.name "pi-sync-test"
mkdir -p worker
printf '{"name":"airplane-frame-worker"}\n' >worker/package.json
printf '{}\n' >worker/package-lock.json
printf 'console.log("ok")\n' >worker/index.js
git add worker
git commit -m "init" >/dev/null
git branch -M main
git push -u origin main >/dev/null 2>&1

export AIRPLANE_FRAME_ROOT="$work"
export AIRPLANE_FRAME_USER="$(id -un)"

# already-current
out="$("$SCRIPT" --dry-run)"
echo "$out" | grep -q 'already-current' || { echo "FAIL: expected already-current: $out" >&2; exit 1; }
[[ ! -s "$PI_SYNC_SYSTEMCTL_LOG" ]] || { echo "FAIL: dry-run restarted service" >&2; exit 1; }

# remote advances with worker code change
cd "$TMP"
git clone "$bare" "$TMP/pusher" >/dev/null 2>&1
cd "$TMP/pusher"
git config user.email "test@example.com"
git config user.name "pi-sync-test"
echo '// change' >>worker/index.js
git add worker/index.js
git commit -m "worker bump" >/dev/null
git push origin main >/dev/null 2>&1

cd "$work"
: >"$PI_SYNC_SYSTEMCTL_LOG"
: >"$PI_SYNC_NPM_LOG"
before="$(git rev-parse HEAD)"
out="$("$SCRIPT" --dry-run)"
echo "$out" | grep -q 'dry-run would' || { echo "FAIL: expected dry-run would: $out" >&2; exit 1; }
echo "$out" | grep -q 'restart' || { echo "FAIL: expected restart in dry-run: $out" >&2; exit 1; }
[[ "$(git rev-parse HEAD)" == "$before" ]] || { echo "FAIL: dry-run moved HEAD" >&2; exit 1; }
[[ ! -s "$PI_SYNC_SYSTEMCTL_LOG" ]] || { echo "FAIL: dry-run called systemctl" >&2; exit 1; }

# real update without package.json change → restart, no npm (non-root → expect die on restart)
# Run with a fake root path: instead, patch by setting SERVICE and expecting error OR
# only test ff-merge when we skip restart by changing a non-worker file.
# Advance with README-only change for successful non-root apply:
cd "$TMP/pusher"
echo 'doc' >README.md
git add README.md
git commit -m "docs only" >/dev/null
git push origin main >/dev/null 2>&1

# First apply worker bump as non-root should fail at restart — use docs-only from current:
# Reset work to before worker bump, then only docs? Simpler: make work catch up via script for docs-only
# after manually ff the worker commit.

cd "$work"
git merge --ff-only origin/main >/dev/null
# now current with both commits; push another docs commit and sync for real
cd "$TMP/pusher"
echo 'doc2' >>README.md
git add README.md
git commit -m "docs 2" >/dev/null
git push origin main >/dev/null 2>&1

cd "$work"
: >"$PI_SYNC_SYSTEMCTL_LOG"
: >"$PI_SYNC_NPM_LOG"
before="$(git rev-parse HEAD)"
out="$("$SCRIPT")"
echo "$out" | grep -q 'updated' || { echo "FAIL: expected updated: $out" >&2; exit 1; }
[[ "$(git rev-parse HEAD)" != "$before" ]] || { echo "FAIL: HEAD not advanced" >&2; exit 1; }
[[ ! -s "$PI_SYNC_NPM_LOG" ]] || { echo "FAIL: unexpected npm ci" >&2; exit 1; }
[[ ! -s "$PI_SYNC_SYSTEMCTL_LOG" ]] || { echo "FAIL: unexpected restart for non-worker change" >&2; exit 1; }

# package.json change triggers npm ci; non-root + worker change dies on restart
cd "$TMP/pusher"
echo '{"name":"airplane-frame-worker","version":"2"}' >worker/package.json
git add worker/package.json
git commit -m "deps" >/dev/null
git push origin main >/dev/null 2>&1

cd "$work"
: >"$PI_SYNC_SYSTEMCTL_LOG"
: >"$PI_SYNC_NPM_LOG"
if "$SCRIPT" 2>"$TMP/err"; then
  echo "FAIL: expected non-root restart failure" >&2
  exit 1
fi
grep -q 'cannot restart' "$TMP/err" || { echo "FAIL: wrong error: $(cat "$TMP/err")" >&2; exit 1; }
# merge should have happened before restart attempt — HEAD advanced, npm ran
[[ -s "$PI_SYNC_NPM_LOG" ]] || { echo "FAIL: expected npm ci" >&2; exit 1; }

echo "pi-sync-main.test.sh: OK"
