# Meadow Farm v8.6 on Render

Run the full farm game and Sepolia reward verifier as a Render Free Web Service.

Build with npm ci --include=dev && npm run build.
Start with npm run start:render.
Set NODE_VERSION=24, NODE_ENV=production, and the server-only MEADOW_REWARD_SIGNER_KEY in Render.
Render supplies PORT, RENDER and RENDER_EXTERNAL_URL.
The health endpoint is /api/health.

The signer must match the verifier address in app/dist/chain-config.mjs.
Local .env files, wallet keys, dependency folders and compiler caches are excluded from deployment source.
The render.yaml file requests a free instance in Singapore.

Free services sleep after 15 minutes of inactivity and wake on the next visit.
Browser saves belong to the game's domain. On-chain TOM and NFTs follow the connected wallet.
