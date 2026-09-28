import type { HistoryPoint, ScanResult } from "./types";

function buildHistory(days: number, start: number, end: number): HistoryPoint[] {
  const points: HistoryPoint[] = [];
  for (let day = days; day >= 0; day -= Math.max(1, Math.floor(days / 12))) {
    const t = 1 - day / days;
    const wobble = Math.sin(day * 0.45) * 4 + Math.cos(day * 0.2) * 2;
    const price = Math.round(start + (end - start) * t + wobble);
    points.push({ day: days - day, price });
  }
  if (points[points.length - 1]?.day !== days) {
    points.push({ day: days, price: end });
  }
  return points;
}

/** Phase 1 stub — real vision + marketplace APIs come in Phase 2. */
export function getStubScanResult(): ScanResult {
  return {
    id: "stub-nike-dunk-low-panda",
    name: "Nike Dunk Low Retro White/Black",
    brand: "Nike",
    category: "Sneakers · Men's 10",
    condition: "Good — light sole wear, clean uppers",
    listAt: 95,
    priceLow: 78,
    priceHigh: 125,
    sources: [
      {
        source: "ebay",
        label: "eBay",
        low: 78,
        high: 118,
        median: 94,
      },
      {
        source: "marketplace",
        label: "Facebook Marketplace",
        low: 70,
        high: 100,
        median: 85,
      },
      {
        source: "stockx",
        label: "StockX",
        low: 102,
        high: 125,
        median: 112,
      },
    ],
    history30: buildHistory(30, 88, 95),
    history60: buildHistory(60, 82, 95),
    sellThrough30: {
      daysToSell: 9,
      demand: "Hot",
      options: [
        { label: "Fast cash", price: 95, daysToSell: 4 },
        { label: "Max profit", price: 120, daysToSell: 21 },
      ],
    },
    sellThrough60: {
      daysToSell: 12,
      demand: "Steady",
      options: [
        { label: "Fast cash", price: 90, daysToSell: 6 },
        { label: "Max profit", price: 125, daysToSell: 28 },
      ],
    },
  };
}
