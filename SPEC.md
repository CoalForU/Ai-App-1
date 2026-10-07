# Resellr — Project Spec

## What we're building

A reseller app on **resellr.live**. Three pillars:

1. **Scanner** — check market prices at a thrift store (camera or manual lookup)
2. **Posts** — fixed-price community listings with a Post button (scanner in the post flow)
3. **Live on camera** — auctions require the seller’s camera broadcasting

**Repo:** github.com/CoalForU/Ai-App-1  
**Domain:** resellr.live

---

## Core loops

### Market check
1. Open Scanner
2. Camera scan **or** manual lookup
3. See comps + sell-through (no requirement to sell)

### Post
1. Open Posts → **Post**
2. Scanner captures the item
3. Set price / details → publish fixed-price post

### Live auction
1. Scan an item → Start & go live
2. Seller hosts with camera on (`/auctions/[id]/host`)
3. Buyers watch live frames; bidding opens only while broadcasting

---

## Screens

### Scanner (`/`)
- Tabs: Camera scan | Manual lookup
- Counts against monthly scan/check limit

### Results
- Market data for the scan/lookup
- Optional: Post listing or Go live on camera (photo required)

### Posts (`/listings`)
- Feed of fixed-price posts
- Floating **Post** button → `/listings/new` (includes scanner)

### Live (`/auctions`)
- Browse auctions (On camera / Waiting)
- Detail shows latest live camera frame
- Host page pushes frames every ~1.5s

### Subscriptions
- Basic $0 / Pro $15/mo / Ultimate $35/mo
- Optional 6-month billing: Pro $84.99 (save $5+) / Ultimate $189.99 (save $20+)

---

## Subscriptions

| Perk | Basic | Pro | Ultimate |
|------|-------|-----|----------|
| Scans / lookups / month | ~7 | ~25 | Unlimited |
| Sell-through | Yes | Yes | Yes |
| Posts / month | 5 | 15 | Unlimited |
| Live auctions / month | 3 | 10 | Unlimited |
| Priority support | No | Yes | Yes |
| Background removal | No | No | Yes |
| Custom notifications | No | No | Yes |
| Price alerts | No | No | Yes |
| Market data | No | No | Yes |
| Monthly | $0 | $15/mo | $35/mo |
| 6 months | — | $84.99 (save $5+) | $189.99 (save $20+) |
