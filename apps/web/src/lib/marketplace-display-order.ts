/** Admin UI tab order for marketplaces. Unknown ids sort last, then by name. */
export const MARKETPLACE_DISPLAY_ORDER = [
  "trendyol",
  "hepsiburada",
  "n11",
  "amazon_tr",
  "pttavm",
  "idefix",
] as const;

export function sortMarketplacesByDisplayOrder<T extends { id: string; name: string }>(items: T[]): T[] {
  const rank = new Map<string, number>(MARKETPLACE_DISPLAY_ORDER.map((id, index) => [id, index]));
  return [...items].sort((a, b) => {
    const ra = rank.get(a.id) ?? 999;
    const rb = rank.get(b.id) ?? 999;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, "tr");
  });
}
