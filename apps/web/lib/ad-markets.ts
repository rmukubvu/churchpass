export type AdDuration = "one_week" | "two_weeks" | "four_weeks";

export type AdMarket = {
  countryCode: string;
  label: string;
  currency: string;
  symbol: string;
  /** Amounts in smallest currency unit (cents, pence, etc.) */
  prices: Record<AdDuration, number>;
};

/** Homepage ad slot pricing by advertiser country (Stripe currency). */
export const AD_MARKETS: AdMarket[] = [
  {
    countryCode: "GB",
    label: "United Kingdom",
    currency: "gbp",
    symbol: "£",
    prices: { one_week: 4900, two_weeks: 8900, four_weeks: 14900 },
  },
  {
    countryCode: "US",
    label: "United States",
    currency: "usd",
    symbol: "$",
    prices: { one_week: 5900, two_weeks: 9900, four_weeks: 17900 },
  },
  {
    countryCode: "CA",
    label: "Canada",
    currency: "cad",
    symbol: "CA$",
    prices: { one_week: 6900, two_weeks: 11900, four_weeks: 19900 },
  },
  {
    countryCode: "AU",
    label: "Australia",
    currency: "aud",
    symbol: "A$",
    prices: { one_week: 7900, two_weeks: 13900, four_weeks: 22900 },
  },
  {
    countryCode: "EU",
    label: "Europe (Eurozone)",
    currency: "eur",
    symbol: "€",
    prices: { one_week: 5500, two_weeks: 9900, four_weeks: 16900 },
  },
];

export const DEFAULT_AD_COUNTRY = "GB";

export function getAdMarket(countryCode: string): AdMarket | undefined {
  return AD_MARKETS.find((m) => m.countryCode === countryCode);
}

export function getAdPrice(countryCode: string, duration: AdDuration): number | undefined {
  return getAdMarket(countryCode)?.prices[duration];
}

/** e.g. £49.00 or $59.00 — hides decimals for whole amounts when possible */
export function formatAdPrice(amountMinor: number, market: AdMarket): string {
  const major = amountMinor / 100;
  const formatted =
    major % 1 === 0
      ? major.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : major.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${market.symbol}${formatted}`;
}

export const AD_DURATION_LABELS: Record<AdDuration, { label: string; desc: string }> = {
  one_week: { label: "1 week", desc: "Great for single events" },
  two_weeks: { label: "2 weeks", desc: "Most popular" },
  four_weeks: { label: "4 weeks", desc: "Maximum exposure" },
};
