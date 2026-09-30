# Marketplace data sources (Phase 2)

## eBay
- **Browse API** — active listing search is available with a free developer app (App ID + OAuth client credentials).
- **Sold/completed comps** — Finding API was shut down (2025). Marketplace Insights exists but is limited-release and usually closed to new apps.
- **MVP:** Live Browse search when `EBAY_APP_ID` + `EBAY_CERT_ID` are set; otherwise realistic stub comps. Sold history estimated from stub heuristics until Insights access exists.

## StockX
- Official Partner API exists but is invite/approval only (not self-serve).
- Broad historical sales feeds are not reliably public.
- **MVP:** Stub adapter with bid/ask-style medians. Wire live client later behind `STOCKX_API_KEY` if approved.

## Facebook Marketplace
- No public Graph API for general Marketplace price search for commercial apps.
- **MVP:** Stub adapter only. Do not scrape.

## Env keys (optional)
```
EBAY_APP_ID=
EBAY_CERT_ID=
OPENAI_API_KEY=          # vision ID + listing copy when set
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_PRO=
STRIPE_PRICE_ULTIMATE=
AUTH_SECRET=             # required in production; auto-dev fallback locally
REMOVE_BG_API_KEY=       # optional; otherwise client-side / canvas fallback
```
