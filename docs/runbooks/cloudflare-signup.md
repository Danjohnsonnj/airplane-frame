# Cloudflare signup (free)

Needed for Worker deploy and `wrangler login`. Free tier is enough for personal use.

## One-time account setup

1. Open https://dash.cloudflare.com/sign-up  
2. Sign up; **verify the account email** (Workers reject deploy until verified):  
   https://developers.cloudflare.com/fundamentals/setup/account/verify-email-address/
3. You do **not** need a custom domain or DNS move for the free Worker.
4. Register a **workers.dev subdomain** (Workers & Pages onboarding). When done, Account Details should show something like:

   - Account ID: (long hex)
   - Subdomain: `yourname.workers.dev`

   This account uses: **`danjohnsonnj.workers.dev`**.

5. From the repo:

```bash
cd worker
npm install
npx wrangler login
npx wrangler whoami
```

Authorize Wrangler in the browser (consent page confirms “Authorization granted to Wrangler”).

6. Continue with [secrets.md](./secrets.md) then [deploy-worker.md](./deploy-worker.md).

## Agent tooling (optional)

Official Cloudflare agent setup: https://developers.cloudflare.com/agent-setup/prompt.md  
This machine already has Cloudflare skills + MCP entries in `~/.cursor/mcp.json`. Restart Cursor after MCP changes; OAuth on first Cloudflare MCP tool use.

## Notes

- Account email can differ from AirLabs.
- Do not paste Cloudflare API tokens into chat; use Wrangler login / `wrangler secret`.
- If login fails, use a current Node LTS and retry `npx wrangler login`.
