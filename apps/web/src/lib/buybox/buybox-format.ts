export function num(v: unknown): number {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function has(v: unknown): boolean {
  if (v === "" || v == null) return false;
  return Number.isFinite(parseFloat(String(v).replace(",", ".")));
}

export function formatTry(x: number): string {
  const sign = x < 0 ? "−" : "";
  return (
    sign +
    Math.abs(x).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    " ₺"
  );
}

export function formatSignedTry(x: number): string {
  return (x > 0 ? "+" : "") + formatTry(x);
}

export function formatPct(x: number): string {
  if (!Number.isFinite(x)) return "—";
  const sign = x < 0 ? "−" : "";
  return sign + "%" + Math.abs(x).toLocaleString("tr-TR", { maximumFractionDigits: 1 });
}
