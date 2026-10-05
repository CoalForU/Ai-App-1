# Resellr

**Domain:** [resellr.live](https://resellr.live)

Scan thrift finds, check market pricing + sell-through, then **list** or run a **live auction** inside Resellr.

## Pricing

| Plan | Monthly | 6 months | Scans | Sell actions |
|------|---------|----------|-------|--------------|
| Basic | Free | — | ~7 / mo | 5 listings + 3 auctions |
| Pro | $15 / month | $84.99 (save $5.01) | ~25 / mo | 10 shared actions |
| Ultimate | $35 / month | $189.99 (save $20.01) | Unlimited | Unlimited |

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
- Fixed-price listings (create, browse, buy now)
- Live auctions (create, browse, bid with live polling)
- Plan limits on scans, listings, and auctions
- Light / dark mode (user toggle)
- Auth + monthly scan limits
- Subscriptions with demo upgrades (Stripe when configured)
- Settings menu for appearance (light/dark), account, and logout
- Ultimate photo cleanup

See `SPEC.md` and `DATA_SOURCES.md`.
