# Pi Worker (Node adapter + Cloudflare Tunnel)

Production API on the Raspberry Pi: home-network egress for airplanes.live, exposed only via Cloudflare Tunnel at `https://api.danjnj.com`. GitHub Pages stays on `main`; the Pi does **not** serve the UI.

Full plan: `~/.cursor/plans/pi_hosted_worker_cloudflare_tunnel_9f3a7c2d.plan.md`.

## Layout

| Path | Owner | Purpose |
|------|-------|---------|
| `/opt/airplane-frame` | `airplane-frame` | Git checkout |
| `/var/lib/airplane-frame/cache.json` | `airplane-frame` | File-backed flight cache (`FLIGHT_CACHE_PATH`) |
| `/etc/airplane-frame/worker.env` | `root:root` mode `600` | Secrets + runtime env (never in git) |
| `/etc/systemd/system/airplane-frame-worker.service` | root | Node API on `127.0.0.1:8788` |
| `/etc/systemd/system/airplane-frame-sync.service` | root | Oneshot sync from `origin/main` |
| `/etc/systemd/system/airplane-frame-sync.timer` | root | Every five minutes (`Persistent=true`) |

## Prerequisites (once)

See plan Slice 6: Node ≥18, user `airplane-frame`, dirs above, read-only GitHub deploy key, clone, `npm ci`, `worker.env` from `worker/.pi.env.example`.

Until `feature/pi-node-adapter` is merged, checkout that branch for smoke tests; after merge, stay on `main` (sync script fast-forwards `main` only).

## Secrets

Create `/etc/airplane-frame/worker.env` (see [secrets.md](./secrets.md) — Pi section). Required: `AIRLABS_API_KEY`, `APP_SHARED_SECRET`. Defaults: `HOST=127.0.0.1`, `PORT=8788`, `FLIGHT_CACHE_PATH=/var/lib/airplane-frame/cache.json`.

```bash
sudo chown root:root /etc/airplane-frame/worker.env
sudo chmod 600 /etc/airplane-frame/worker.env
```

Never print or paste this file into chat, git, or screenshots.

## systemd units

Canonical unit files live in the repo at `deploy/systemd/` (same contents as below). Prefer **copying those files** — do not paste into nano over SSH (clipboard paste often fails).

**From Mac (Terminal.app), after units are on your laptop checkout:**

```bash
cd "/Users/danjohnson/Local Documents/repos/airplane-frame"
scp deploy/systemd/airplane-frame-worker.service \
    deploy/systemd/airplane-frame-sync.service \
    deploy/systemd/airplane-frame-sync.timer \
    pi@192.168.1.46:/tmp/
ssh pi@192.168.1.46
sudo mv /tmp/airplane-frame-worker.service \
        /tmp/airplane-frame-sync.service \
        /tmp/airplane-frame-sync.timer \
        /etc/systemd/system/
```

**Or on the Pi** once this commit is in the checkout (`git pull` / fetch on `feature/pi-node-adapter`):

```bash
sudo cp /opt/airplane-frame/deploy/systemd/airplane-frame-worker.service \
       /opt/airplane-frame/deploy/systemd/airplane-frame-sync.service \
       /opt/airplane-frame/deploy/systemd/airplane-frame-sync.timer \
       /etc/systemd/system/
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now airplane-frame-worker.service
sudo systemctl enable --now airplane-frame-sync.timer
```

Reference copies (for reading only):

### `airplane-frame-worker.service`

See `deploy/systemd/airplane-frame-worker.service`.

### `airplane-frame-sync.service`

See `deploy/systemd/airplane-frame-sync.service`. Sync script runs git/`npm ci` as `airplane-frame` via `runuser`, and restarts the worker only when `worker/` paths changed.

### `airplane-frame-sync.timer`

See `deploy/systemd/airplane-frame-sync.timer` (every five minutes, `Persistent=true`).

## Sync script

`scripts/pi-sync-main.sh` (in the checkout):

- `git fetch origin main` + fast-forward only
- no-op success when already current
- `npm ci` only if `worker/package.json` or `worker/package-lock.json` changed
- restart worker service only if any `worker/` path changed
- `--dry-run` reports actions without merge, npm, or restart
- never prints env/secrets

Verify on a disposable checkout (or CI-style):

```bash
bash -n scripts/pi-sync-main.sh
./scripts/pi-sync-main.test.sh
# optional: shellcheck scripts/pi-sync-main.sh
```

On the Pi (as root):

```bash
sudo /opt/airplane-frame/scripts/pi-sync-main.sh --dry-run
sudo systemctl start airplane-frame-sync.service
sudo journalctl -u airplane-frame-sync.service -n 50 --no-pager
```

## Health, logs, ops

```bash
curl -i http://127.0.0.1:8788/health
sudo systemctl status airplane-frame-worker.service --no-pager
sudo journalctl -u airplane-frame-worker -n 100 --no-pager
sudo systemctl start airplane-frame-sync.service
sudo systemctl list-timers airplane-frame-sync.timer
```

**Cache reset** (forces empty file cache; service recreates on next write):

```bash
sudo systemctl stop airplane-frame-worker.service
sudo -u airplane-frame rm -f /var/lib/airplane-frame/cache.json
sudo systemctl start airplane-frame-worker.service
```

**Manual upgrade** (same as timer):

```bash
sudo systemctl start airplane-frame-sync.service
```

**Rollback (API):** keep Pi running; open Pages with `?worker=cloudflare` for the legacy Worker. To roll Pi code back, `git -C /opt/airplane-frame` as `airplane-frame` to a known-good `main` SHA, then `sudo systemctl restart airplane-frame-worker.service` (prefer fixing forward when possible).

## Tunnel

**Live (2026-08-02):** tunnel name `airplane-frame-pi` (Debian **arm64** installer). Published application: hostname `api.danjnj.com` → service `http://127.0.0.1:8788`. Cloudflare auto-created CNAME `api.danjnj.com` → `3f42e0bf-6401-421d-8f4f-fc6d14201893.cfargotunnel.com`. Do not open router ports.

UI path if recreating: **Networking → Tunnels** → tunnel → **Add a route** → **Published application** (not Private hostname / CIDR).

Public check (from a non-Pi host; Node/API must be listening on the Pi):

```bash
curl -i https://api.danjnj.com/health
```

Manual start with secrets (file is `root:root` 600 — do not `source` as `airplane-frame`):

```bash
cd /opt/airplane-frame/worker
sudo bash -c 'set -a; source /etc/airplane-frame/worker.env; set +a; runuser -u airplane-frame -- npm run start:pi'
```

## Pages

Default production UI calls `https://api.danjnj.com`. Explicit rollback: `?worker=cloudflare`. See [pages.md](./pages.md).
