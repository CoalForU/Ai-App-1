# Resellr — Project Spec

## What we're building

A reseller app on **resellr.live**. The user photographs an item, AI identifies it, the app shows market pricing and sell-through, then the user can run a **live auction inside Resellr** — not post to other apps/sites.

**Repo:** github.com/CoalForU/Ai-App-1  
**Domain:** resellr.live

---

## Core loop

1. User opens the scan screen and takes a photo (optional barcode/UPC)
2. AI identifies the item; scan is saved to history with feedback
3. App shows pricing comps + sell-through
4. User starts a live auction on Resellr
5. Buyers bid, watch, get notified; winner checks out; seller gets payout

---

## Screens

### Scan screen
- Camera + upload + optional barcode/UPC
- Navigate straight to Results after capture

### Results page
- Item ID, price range, history (30/60), sell-through
- ID correct/wrong feedback + barcode field
- Pro photo cleanup
- **Start live auction**

### Live auctions / discovery
- Search by query, category, brand, size
- Sort: ending soon, hot, newest, highest bid
- Hot right now rail
- Auction detail: watchlist, live bids, soft close
- Winner checkout CTA

### Seller dashboard
- Live / sold / unsold lots
- Relist unsold
- Orders + mark payout sent

### Watchlist & notifications
- Watch lots; outbid + ending-soon alerts
- Wins, payments, payouts, disputes, ratings

### Checkout / payouts
- Demo pay for won auctions (Stripe Checkout when secret key set)
- Seller marks payout sent; verified seller badge after first paid sale
- **Marketplace take-rate / fees intentionally deferred**

### Trust
- Ratings after paid orders
- Verified seller badge
- Disputes after payment

### Scan history
- Past scans, barcodes, ID feedback

### Subscriptions
- Basic $0 / Pro $15 / Ultimate $35

### Settings
- Preferences: light (white) / dark (black)
- Dashboard, notifications, watchlist, history, disputes
- Account / subscriptions / support / log out

### Mobile
- PWA manifest + service worker
- Camera capture attribute, mobile-friendly spacing

---

## Subscriptions

| Perk | Basic | Pro | Ultimate |
|------|-------|-----|----------|
| Scans / month | ~7 | ~25 | Unlimited |
| Sell-through | Yes | Yes | Yes |
| Live auctions | Yes | Yes | Yes |
| Background removal | No | Yes | Yes |
| Priority support | No | Yes | Yes |
| Custom notifications | No | Yes | Yes |
| Price alerts | No | No | Yes |
| Market data | No | No | Yes |
| Price | $0 | $15/mo | $35/mo |
