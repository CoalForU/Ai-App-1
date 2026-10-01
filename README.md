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

- Scan → Results (comps + sell-through, barcode/UPC, ID feedback)
- Live auctions with search/discovery, watchlist, soft-close bidding
- Seller dashboard (live/sold/unsold, relist, payouts)
- Notifications (outbid, ending soon, payments, disputes, ratings)
- Checkout for winners (demo pay; Stripe when keyed) — take-rate TBD
- Trust: ratings, verified sellers, disputes
- Scan history
- Light / dark mode via Settings
- Auth + monthly scan limits + subscriptions
- PWA (installable, offline shell)
- Pro photo cleanup

See `SPEC.md` and `DATA_SOURCES.md`.
