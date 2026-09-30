# Resellr — Project Spec

## What we're building

A reseller app on **resellr.live**. The user photographs an item, AI identifies it, the app shows market pricing and sell-through, then the user can run a **live auction inside Resellr** — not post to other apps/sites.

**Repo:** github.com/CoalForU/Ai-App-1  
**Domain:** resellr.live

---

## Core loop

1. User opens the scan screen and takes a photo
2. AI identifies the item
3. App shows pricing comps + sell-through
4. User starts a live auction on Resellr
5. Buyers bid in real time until the auction ends

---

## Screens

### Scan screen
- Camera + upload
- Navigate straight to Results after capture

### Results page
- Item ID, price range, history (30/60), sell-through
- Pro photo cleanup
- **Start live auction** (starting bid, optional reserve, duration)

### Live auctions
- Browse live/ended auctions
- Auction detail with live bid updates
- Soft close: last-2-minute bids extend by 2 minutes

### Plans
- Basic $0 / Pro $15 / Ultimate $35

### Theme
- Blue accent
- User-controlled light / dark mode

---

## Plans

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
