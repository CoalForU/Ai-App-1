# Ai-App-1 — Project Spec

## What we're building

A reseller tool. The user photographs an item, AI identifies it, the app pulls pricing from marketplaces, shows how fast it sells, and drafts a ready-to-post listing.

**Repo:** github.com/CoalForU/Ai-App-1

Explain choices as you go. Don't add dependencies or abstractions without a clear reason.

---

## Core loop

1. User opens the scan screen and takes a photo of an item
2. AI identifies the item (brand, model, category, condition)
3. App searches pricing across eBay, Facebook Marketplace, and StockX
4. Results page shows price range, price history graph, and sell-through data
5. AI drafts an optimized marketplace listing the user can copy or edit

---

## Screens

### Scan screen

- Camera view, big shutter button
- Option to upload from photo library instead
- Loading state while the AI works
- **As soon as the photo is taken or uploaded, navigate to the Results page.** The scan screen does not display any results itself.

### Results page

Separate screen the user lands on right after the scan. One long scroll (no tabs for v1).

- Item name and photo at the top
- Price range with a clear "list at" suggestion
- Prices broken out by source: eBay, Facebook Marketplace, StockX
- Price history graph with a toggle to switch between 30 days and 60 days
- Sell through shown as:
  - **Days to sell**, phrased plainly (e.g. "Typically sells in 9 days")
  - A one-word demand label: **Hot / Steady / Slow**, color coded
- Sell speed recalculates when the 30/60 toggle is flipped
- Fast sale price vs max profit price side by side, with sell time for each
- Button to generate the listing

### Listing generation

- AI writes a title, description, and suggested category
- Copy button for each field
- User can edit before copying

### Photo cleanup (Pro feature)

- Auto remove the background from the scan photo, replace with white
- Show before and after, let the user keep either

### Paywall / plans screen

- Comparison table showing all three tiers side by side
- Make the upgrade path obvious

---

## Plans & pricing

| Perk | Basic (Free) | Pro | Ultimate |
|------|--------------|-----|----------|
| Scans per month | ~7 | ~25 | Unlimited |
| Sell through data | Yes | Yes | Yes |
| Listing generation | Yes | Yes | Yes |
| Background removal | No | Yes | Yes |
| Priority support | No | Yes | Yes |
| Custom notifications | No | Yes | Yes |
| Price alerts | No | No | Yes |
| Market data | No | No | Yes |
| **Price** | **$0** | **$15/mo** | **$35/mo** |

Pricing rationale locked in:

- **Basic $0** — enough scans to feel the core loop and get hooked
- **Pro $15** — mid-range for part-time resellers; covers ~25 scans + background removal cost
- **Ultimate $35** — full-timers who want unlimited scans, alerts, and deeper market data

---

## Build order

Do these in order. Don't jump ahead. Stop after each phase for testing.

### Phase 1 — Core loop, no accounts

- Scan screen that takes a photo (or uploads)
- Send the photo to a vision model (or stub ID in Phase 1 if no API key yet)
- Navigate to Results page immediately after capture
- Stub/hardcode pricing, history, and sell-through for now

### Phase 2 — Real pricing

- Wire up real marketplace pricing
- Price range, per-source breakdown
- Price history graph with 30/60 toggle
- Sell through: days to sell + demand label
- **Before writing pricing code:** report what's available/costs for eBay, StockX, and Facebook Marketplace APIs

### Phase 3 — Listing generation

- AI drafts title, description, category
- Editable fields with copy buttons

### Phase 4 — Accounts and scan limits

- Sign up / log in
- Track scans per user per month
- Enforce the Basic tier cap (~7)

### Phase 5 — Payments and tiers

- Comparison table paywall screen
- Subscription billing ($15 Pro / $35 Ultimate)
- Gate Pro and Ultimate features

### Phase 6 — Background removal

- Auto background strip on scan photos, Pro and up

---

## Stack (Phase 1)

- **Next.js (App Router) + TypeScript + React** — web-first so we can ship and test fast; camera + upload work on mobile browsers; can wrap native later if needed
- **CSS modules / plain CSS variables** — no heavy UI kit; keep the look intentional
- Stubbed vision + pricing until Phase 2 keys are ready

---

## Data sources (Phase 2 gate)

Before writing pricing code, document:

1. **eBay** — developer API; active listings open; sold/completed often gated — what access is needed
2. **StockX** — usable API or partner program?
3. **Facebook Marketplace** — what's legitimately available
