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

Copy these three files to `/etc/systemd/system/`, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now airplane-frame-worker.service
sudo systemctl enable --now airplane-frame-sync.timer
```

### `airplane-frame-worker.service`

```ini
[Unit]
Description=airplane-frame Pi API (Node adapter)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=airplane-frame
Group=airplane-frame
WorkingDirectory=/opt/airplane-frame/worker
EnvironmentFile=/etc/airplane-frame/worker.env
Environment=PATH=/usr/local/bin:/usr/bin
ExecStart=/usr/bin/npm run start:pi
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

# Hardening (loopback bind is still required via HOST=127.0.0.1 in worker.env)
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### `airplane-frame-sync.service`

```ini
[Unit]
Description=airplane-frame sync origin/main into /opt/airplane-frame
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=root
Environment=PATH=/usr/local/bin:/usr/bin
ExecStart=/opt/airplane-frame/scripts/pi-sync-main.sh
```

The sync script runs git/`npm ci` as `airplane-frame` via `runuser`, and restarts `airplane-frame-worker.service` only when paths under `worker/` changed.

### `airplane-frame-sync.timer`

```ini
[Unit]
Description=airplane-frame sync timer (every 5 minutes)

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
Persistent=true
Unit=airplane-frame-sync.service

[Install]
WantedBy=timers.target
```

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

After local `/health` is 200: Cloudflare **Networking → Tunnels** → connector on the Pi → published hostname `api.danjnj.com` → `http://127.0.0.1:8788`. Do not open router ports. Public check: `curl -i https://api.danjnj.com/health`.

Details: plan Slice 7.

## Pages

Default production UI calls `https://api.danjnj.com`. Explicit rollback: `?worker=cloudflare`. See [pages.md](./pages.md).
