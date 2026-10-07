# Resellr

**Domain:** [resellr.live](https://resellr.live)

Scanner for thrift finds, community **posts**, and **live-on-camera** auctions.

## Pricing

| Plan | Monthly | 6 months | Scans | Posts | Live auctions |
|------|---------|----------|-------|-------|---------------|
| Basic | Free | — | ~7 / mo | 5 / mo | 3 / mo |
| Pro | $15 / month | $84.99 (save $5+) | ~25 / mo | 15 / mo | 10 / mo |
| Ultimate | $35 / month | $189.99 (save $20+) | Unlimited | Unlimited | Unlimited |

Background removal and custom notifications are Ultimate-only.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's built

- **Scanner** — camera scan + manual lookup for market checks
- **Posts** — fixed-price feed with Post button (scanner in post flow)
- **Live on camera** — seller broadcasts frames; bidding opens while live
- Plan limits on scans, posts, and auctions
- Light / dark mode, auth, subscriptions, Ultimate photo cleanup

See `SPEC.md` and `DATA_SOURCES.md`.
