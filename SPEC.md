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
- Ultimate photo cleanup
- **Start live auction** (starting bid, optional reserve, duration)

### Live auctions
- Browse live/ended auctions
- Auction detail with live bid updates
- Soft close: last-2-minute bids extend by 2 minutes

### Subscriptions
- Basic $0 / Pro $15/mo / Ultimate $35/mo
- Optional 6-month billing at 5% off ($85.50 Pro / $199.50 Ultimate)

### Settings
- Preferences: light (white) / dark (black) appearance
- Account / profile, subscriptions, support links
- Log out

---

## Subscriptions

| Perk | Basic | Pro | Ultimate |
|------|-------|-----|----------|
| Scans / month | ~7 | ~25 | Unlimited |
| Sell-through | Yes | Yes | Yes |
| Live auctions | Yes | Yes | Yes |
| Background removal | No | No | Yes |
| Priority support | No | Yes | Yes |
| Custom notifications | No | No | Yes |
| Price alerts | No | No | Yes |
| Market data | No | No | Yes |
| Monthly | $0 | $15/mo | $35/mo |
| 6 months (save 5%) | — | $85.50 | $199.50 |
