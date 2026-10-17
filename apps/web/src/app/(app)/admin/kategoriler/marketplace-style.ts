export type MarketplaceStyle = {
  label: string;
  tab: string;
  dot: string;
  icon: string;
};

/** Accent tints derived from the app theme (no new brand colors). */
export const marketplaceStyle: Record<string, MarketplaceStyle> = {
  trendyol: {
    label: "Trendyol",
    tab: "border-drop/30 bg-drop-soft text-drop shadow-[inset_0_0_0_1px_rgb(18_128_92/0.12)]",
    dot: "bg-drop",
    icon: "bg-drop-soft text-drop",
  },
  n11: {
    label: "n11",
    tab: "border-ink/10 bg-surface text-ink shadow-[inset_0_0_0_1px_rgb(13_12_34/0.06)]",
    dot: "bg-ink",
    icon: "bg-surface text-ink",
  },
  hepsiburada: {
    label: "Hepsiburada",
    tab: "border-rise/25 bg-rise-soft text-rise shadow-[inset_0_0_0_1px_rgb(200_50_43/0.12)]",
    dot: "bg-rise",
    icon: "bg-rise-soft text-rise",
  },
  amazon_tr: {
    label: "Amazon TR",
    tab: "border-line bg-canvas text-ink-soft",
    dot: "bg-muted",
    icon: "bg-canvas text-muted",
  },
};

export function styleForMarketplace(id: string): MarketplaceStyle {
  return (
    marketplaceStyle[id] ?? {
      label: id,
      tab: "border-line bg-white text-ink",
      dot: "bg-muted",
      icon: "bg-surface text-muted",
    }
  );
}
