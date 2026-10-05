# Resellr

**Domain:** [resellr.live](https://resellr.live)

Scan thrift finds, check market pricing + sell-through, then run a **live auction** inside Resellr.

## Pricing

| Plan | Monthly | 6 months | Scans |
|------|---------|----------|-------|
| Basic | Free | — | ~7 / month |
| Pro | $15 / month | $84.99 (save $5.01) | ~25 / month |
| Ultimate | $35 / month | $199.99 (save $10.01) | Unlimited |

Background removal and custom notifications are Ultimate-only.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's built

- Scan → Results (comps + sell-through)
- Live auctions (create, browse, bid with live polling)
- Light / dark mode (user toggle)
- Auth + monthly scan limits
- Subscriptions with demo upgrades (Stripe when configured)
- Settings menu for appearance (light/dark), account, and logout
- Ultimate photo cleanup

See `SPEC.md` and `DATA_SOURCES.md`.
