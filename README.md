# Resellr

**Domain:** [resellr.live](https://resellr.live)

Scan thrift finds, check market pricing + sell-through, then run a **live auction** inside Resellr.

## Pricing

| Plan | Price | Scans |
|------|-------|-------|
| Basic | Free | ~7 / month |
| Pro | $15 / month | ~25 / month |
| Ultimate | $35 / month | Unlimited |

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
- Plans with demo upgrades (Stripe when configured)
- Pro photo cleanup

See `SPEC.md` and `DATA_SOURCES.md`.
