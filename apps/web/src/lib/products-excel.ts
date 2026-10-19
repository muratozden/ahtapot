import * as XLSX from "xlsx";
import type { TrackedProductRow } from "./tracked-products";

function storedRateToPercent(stored: string | null): number | null {
  if (stored === null) return null;
  const n = Number(stored) * 100;
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function formatPrice(price: string | null, currency: string | null) {
  if (price === null) return "";
  const n = Number(price);
  if (!Number.isFinite(n)) return price;
  const cur = currency ?? "TRY";
  return `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
}

function formatRating(rating: string | null) {
  if (rating === null) return "";
  const n = Number(rating);
  return Number.isFinite(n) ? n : rating;
}

function formatDate(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

const HEADERS = [
  "Pazaryeri",
  "Ürün adı",
  "Marka",
  "URL",
  "Kategori",
  "Son fiyat",
  "Stok",
  "Puan",
  "Değerlendirme sayısı",
  "Komisyon (%)",
  "KDV (%)",
  "Pazarlama bedeli (%)",
  "Pazaryeri hizmet bedeli (%)",
  "Etiket",
  "Takip aktif",
  "Son kontrol",
] as const;

function rowToSheetRow(row: TrackedProductRow): (string | number | boolean)[] {
  return [
    row.marketplaceName,
    row.title ?? "",
    row.brand ?? "",
    row.canonicalUrl,
    row.categoryPath ?? "",
    formatPrice(row.lastPrice, row.lastCurrency),
    row.lastInStock === null ? "" : row.lastInStock ? "Stokta" : "Stok yok",
    formatRating(row.rating),
    row.reviewCount ?? "",
    storedRateToPercent(row.commissionRate) ?? "",
    storedRateToPercent(row.vatRate) ?? "",
    storedRateToPercent(row.marketingFeeRate) ?? "",
    storedRateToPercent(row.marketplaceServiceFeeRate) ?? "",
    row.label ?? "",
    row.isActive ? "Evet" : "Hayır",
    formatDate(row.lastCheckedAt),
  ];
}

export function buildProductsExcelBuffer(rows: TrackedProductRow[]): Buffer {
  const data = [HEADERS as unknown as string[], ...rows.map(rowToSheetRow)];
  const sheet = XLSX.utils.aoa_to_sheet(data);
  sheet["!cols"] = [
    { wch: 14 },
    { wch: 36 },
    { wch: 16 },
    { wch: 42 },
    { wch: 40 },
    { wch: 14 },
    { wch: 10 },
    { wch: 8 },
    { wch: 18 },
    { wch: 12 },
    { wch: 10 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Ürünler");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function productsExportFilename() {
  const stamp = new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/\./g, "-");
  return `ahtapot-urunler-${stamp}.xlsx`;
}
