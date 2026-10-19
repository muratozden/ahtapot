import "server-only";
import { schema } from "@ahtapot/db";
import { and, desc, eq, isNull } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "./db";

const { trackedListings, listings, marketplaces, categoryCommissionRates } = schema;

export type TrackedProductRow = {
  trackedId: number;
  label: string | null;
  isActive: boolean;
  marketplaceId: string;
  marketplaceName: string;
  title: string | null;
  brand: string | null;
  canonicalUrl: string;
  categoryPath: string | null;
  lastPrice: string | null;
  lastCurrency: string | null;
  lastInStock: boolean | null;
  rating: string | null;
  reviewCount: number | null;
  lastCheckedAt: Date | null;
  commissionRate: string | null;
  vatRate: string | null;
  marketingFeeRate: string | null;
  marketplaceServiceFeeRate: string | null;
};

export async function listTrackedProductsForSeller(sellerId: string): Promise<TrackedProductRow[]> {
  await connection();

  return db
    .select({
      trackedId: trackedListings.id,
      label: trackedListings.label,
      isActive: trackedListings.isActive,
      marketplaceId: listings.marketplaceId,
      marketplaceName: marketplaces.name,
      title: listings.title,
      brand: listings.brand,
      canonicalUrl: listings.canonicalUrl,
      categoryPath: listings.categoryPath,
      lastPrice: listings.lastPrice,
      lastCurrency: listings.lastCurrency,
      lastInStock: listings.lastInStock,
      rating: listings.rating,
      reviewCount: listings.reviewCount,
      lastCheckedAt: listings.lastCheckedAt,
      commissionRate: categoryCommissionRates.rate,
      vatRate: categoryCommissionRates.vatRate,
      marketingFeeRate: categoryCommissionRates.marketingFeeRate,
      marketplaceServiceFeeRate: categoryCommissionRates.marketplaceServiceFeeRate,
    })
    .from(trackedListings)
    .innerJoin(listings, eq(trackedListings.listingId, listings.id))
    .innerJoin(marketplaces, eq(listings.marketplaceId, marketplaces.id))
    .leftJoin(
      categoryCommissionRates,
      and(
        eq(categoryCommissionRates.categoryId, listings.marketplaceCategoryId),
        isNull(categoryCommissionRates.effectiveTo),
      ),
    )
    .where(eq(trackedListings.sellerId, sellerId))
    .orderBy(desc(trackedListings.createdAt));
}
