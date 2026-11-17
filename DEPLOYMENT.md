# Render deployment

Use a Render Web Service with runtime Node, plan Free and region Singapore.

Build command: npm ci --include=dev && npm run build
Start command: npm run start:render
Health check: /api/health

Set NODE_VERSION=24 and NODE_ENV=production. Render supplies PORT, RENDER and RENDER_EXTERNAL_URL automatically.

Set MEADOW_REWARD_SIGNER_KEY in the service environment. It must match the reward verifier in app/dist/chain-config.mjs. Keep the existing key server-side and out of the repository. Optional MEADOW_RPC_URL selects another Sepolia HTTPS RPC.

The Node adapter at app/tools/start-render.mjs serves the same compiled worker and static assets as the local game. It binds to 0.0.0.0:$PORT, preserves HTTPS origins through Render's reverse proxy, and passes the visitor address to the worker's rate limits.

Free services sleep after 15 minutes without requests and need about a minute to wake. Browser saves belong to the public game domain; TOM and NFTs remain on Ethereum Sepolia. Review https://render.com/docs/free for shared usage limits.

After the service is created, pushes to main trigger deployment automatically.
