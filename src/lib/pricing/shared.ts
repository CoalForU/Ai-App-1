import type {
  DemandLabel,
  HistoryPoint,
  IdentifiedItem,
  ScanResult,
  SellThrough,
  SourcePrice,
} from "../types";

export function buildHistory(
  days: number,
  start: number,
  end: number,
): HistoryPoint[] {
  const points: HistoryPoint[] = [];
  const step = Math.max(1, Math.floor(days / 12));
  for (let day = 0; day <= days; day += step) {
    const t = day / days;
    const wobble = Math.sin(day * 0.45) * 4 + Math.cos(day * 0.2) * 2;
    points.push({
      day,
      price: Math.round(start + (end - start) * t + wobble),
    });
  }
  if (points[points.length - 1]?.day !== days) {
    points.push({ day: days, price: end });
  }
  return points;
}

export function demandFromDays(days: number): DemandLabel {
  if (days <= 10) return "Hot";
  if (days <= 21) return "Steady";
  return "Slow";
}

export function buildSellThrough(
  listAt: number,
  windowDays: 30 | 60,
): SellThrough {
  const baseDays = windowDays === 30 ? 9 : 12;
  const fastPrice = Math.round(listAt * (windowDays === 30 ? 1 : 0.95));
  const maxPrice = Math.round(listAt * (windowDays === 30 ? 1.26 : 1.32));
  const fastDays = windowDays === 30 ? 4 : 6;
  const maxDays = windowDays === 30 ? 21 : 28;

  return {
    daysToSell: baseDays,
    demand: demandFromDays(baseDays),
    options: [
      { label: "Fast cash", price: fastPrice, daysToSell: fastDays },
      { label: "Max profit", price: maxPrice, daysToSell: maxDays },
    ],
  };
}

export function mergeSources(sources: SourcePrice[]) {
  const lows = sources.map((s) => s.low);
  const highs = sources.map((s) => s.high);
  const medians = sources.map((s) => s.median);
  const priceLow = Math.min(...lows);
  const priceHigh = Math.max(...highs);
  const listAt = Math.round(
    medians.reduce((sum, n) => sum + n, 0) / medians.length,
  );
  return { priceLow, priceHigh, listAt };
}

export function assembleScanResult(
  item: IdentifiedItem,
  sources: SourcePrice[],
  pricingMode: "live" | "stub",
): ScanResult {
  const { priceLow, priceHigh, listAt } = mergeSources(sources);
  return {
    ...item,
    listAt,
    priceLow,
    priceHigh,
    sources,
    history30: buildHistory(30, Math.round(listAt * 0.92), listAt),
    history60: buildHistory(60, Math.round(listAt * 0.86), listAt),
    sellThrough30: buildSellThrough(listAt, 30),
    sellThrough60: buildSellThrough(listAt, 60),
    pricingMode,
  };
}

export const DEFAULT_ITEM: IdentifiedItem = {
  id: "stub-nike-dunk-low-panda",
  name: "Nike Dunk Low Retro White/Black",
  brand: "Nike",
  category: "Sneakers · Men's 10",
  condition: "Good — light sole wear, clean uppers",
  searchQuery: "Nike Dunk Low Retro White Black",
};
