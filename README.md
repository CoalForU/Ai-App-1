# FlipScout (Ai-App-1)

Reseller tool: photograph an item, see marketplace pricing + sell-through, draft a listing.

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

- **Phase 1** Scan → Results core loop
- **Phase 2** Pricing adapters (live eBay Browse when keys set; StockX/FB stubs — see `DATA_SOURCES.md`)
- **Phase 3** Listing generation (editable + copy)
- **Phase 4** Auth + monthly scan limits
- **Phase 5** Plans / demo upgrades (Stripe when configured)
- **Phase 6** Background cleanup (Pro+; remove.bg when keyed, studio white fallback otherwise)

See `SPEC.md` for the product spec.
