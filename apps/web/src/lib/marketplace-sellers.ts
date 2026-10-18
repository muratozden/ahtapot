import "server-only";
import { schema } from "@ahtapot/db";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "./db";
import { requireRole } from "./session";

const { marketplaceSellers, marketplaces } = schema;

const PAGE_SIZE = 50;

export type MarketplaceSellerListParams = {
  marketplaceId?: string;
  q?: string;
  page?: number;
};

export type MarketplaceSellerRow = {
  id: number;
  marketplaceId: string;
  externalSellerId: string;
  storeName: string | null;
  storeUrl: string | null;
  commercialTitle: string | null;
  location: string | null;
  address: string | null;
  mersisNo: string | null;
  taxId: string | null;
  phone: string | null;
  avgShippingDays: string | null;
  avgMessageResponseHours: string | null;
  rating: string | null;
  productCount: number | null;
  lastSyncedAt: Date | null;
};

export async function listMarketplacesForSellerAdmin() {
  await requireRole("admin");
  await connection();
  return db.select({ id: marketplaces.id, name: marketplaces.name }).from(marketplaces).orderBy(marketplaces.name);
}

export async function listMarketplaceSellers(params: MarketplaceSellerListParams) {
  await requireRole("admin");
  await connection();

  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;

  const filters = [];
  if (params.marketplaceId) filters.push(eq(marketplaceSellers.marketplaceId, params.marketplaceId));

  const term = params.q?.trim();
  if (term) {
    filters.push(
      or(
        ilike(marketplaceSellers.storeName, `%${term}%`),
        ilike(marketplaceSellers.commercialTitle, `%${term}%`),
        ilike(marketplaceSellers.externalSellerId, `%${term}%`),
        ilike(marketplaceSellers.taxId, `%${term}%`),
        ilike(marketplaceSellers.location, `%${term}%`),
      )!,
    );
  }

  const where = filters.length ? and(...filters) : undefined;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: marketplaceSellers.id,
        marketplaceId: marketplaceSellers.marketplaceId,
        externalSellerId: marketplaceSellers.externalSellerId,
        storeName: marketplaceSellers.storeName,
        storeUrl: marketplaceSellers.storeUrl,
        commercialTitle: marketplaceSellers.commercialTitle,
        location: marketplaceSellers.location,
        address: marketplaceSellers.address,
        mersisNo: marketplaceSellers.mersisNo,
        taxId: marketplaceSellers.taxId,
        phone: marketplaceSellers.phone,
        avgShippingDays: marketplaceSellers.avgShippingDays,
        avgMessageResponseHours: marketplaceSellers.avgMessageResponseHours,
        rating: marketplaceSellers.rating,
        productCount: marketplaceSellers.productCount,
        lastSyncedAt: marketplaceSellers.lastSyncedAt,
      })
      .from(marketplaceSellers)
      .where(where)
      .orderBy(desc(marketplaceSellers.updatedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ n: count() }).from(marketplaceSellers).where(where),
  ]);

  const total = totalRow.n;
  return {
    rows: rows as MarketplaceSellerRow[],
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    pageSize: PAGE_SIZE,
  };
}

export async function countMarketplaceSellers(marketplaceId?: string) {
  await requireRole("admin");
  await connection();
  const where = marketplaceId ? eq(marketplaceSellers.marketplaceId, marketplaceId) : undefined;
  const [row] = await db.select({ n: count() }).from(marketplaceSellers).where(where);
  return row.n;
}
