import "server-only";
import { schema } from "@ahtapot/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "./db";

const { categoryCommissionRates } = schema;

export type CategoryFeeRates = {
  commission: string | null;
  vat: string | null;
  marketing: string | null;
  marketplaceService: string | null;
};

export type CategoryFeeInput = {
  commissionPercent: number | null;
  vatPercent: number | null;
  marketingPercent: number | null;
  marketplaceServicePercent: number | null;
};

function toStoredRate(percent: number | null) {
  return percent === null ? null : (percent / 100).toFixed(4);
}

function rowToFees(row: {
  rate: string | null;
  vatRate: string | null;
  marketingFeeRate: string | null;
  marketplaceServiceFeeRate: string | null;
}): CategoryFeeRates {
  return {
    commission: row.rate,
    vat: row.vatRate,
    marketing: row.marketingFeeRate,
    marketplaceService: row.marketplaceServiceFeeRate,
  };
}

function feesEmpty(fees: CategoryFeeInput) {
  return (
    fees.commissionPercent === null &&
    fees.vatPercent === null &&
    fees.marketingPercent === null &&
    fees.marketplaceServicePercent === null
  );
}

export async function getCategoryFeesForCategories(categoryIds: number[]) {
  if (categoryIds.length === 0) return new Map<number, CategoryFeeRates>();

  await connection();

  const rows = await db
    .select({
      categoryId: categoryCommissionRates.categoryId,
      rate: categoryCommissionRates.rate,
      vatRate: categoryCommissionRates.vatRate,
      marketingFeeRate: categoryCommissionRates.marketingFeeRate,
      marketplaceServiceFeeRate: categoryCommissionRates.marketplaceServiceFeeRate,
    })
    .from(categoryCommissionRates)
    .where(and(inArray(categoryCommissionRates.categoryId, categoryIds), isNull(categoryCommissionRates.effectiveTo)));

  return new Map(rows.map((r) => [r.categoryId, rowToFees(r)]));
}

export async function setCategoryFees(categoryId: number, fees: CategoryFeeInput) {
  await connection();

  const open = await db
    .select({ id: categoryCommissionRates.id })
    .from(categoryCommissionRates)
    .where(and(eq(categoryCommissionRates.categoryId, categoryId), isNull(categoryCommissionRates.effectiveTo)))
    .limit(1);

  if (feesEmpty(fees)) {
    if (open[0]) {
      await db.delete(categoryCommissionRates).where(eq(categoryCommissionRates.id, open[0].id));
    }
    return;
  }

  const values = {
    rate: toStoredRate(fees.commissionPercent),
    vatRate: toStoredRate(fees.vatPercent),
    marketingFeeRate: toStoredRate(fees.marketingPercent),
    marketplaceServiceFeeRate: toStoredRate(fees.marketplaceServicePercent),
  };

  if (open[0]) {
    await db.update(categoryCommissionRates).set(values).where(eq(categoryCommissionRates.id, open[0].id));
    return;
  }

  await db.insert(categoryCommissionRates).values({ categoryId, ...values });
}

function storedToPercent(stored: string | null) {
  if (stored === null) return null;
  const n = Number(stored) * 100;
  return Number.isFinite(n) ? n : null;
}

export type CategoryFeePatch = {
  commissionPercent?: number | null;
  vatPercent?: number | null;
  marketingPercent?: number | null;
  marketplaceServicePercent?: number | null;
};

function mergeFeePatch(existing: CategoryFeeRates | undefined, patch: CategoryFeePatch): CategoryFeeInput {
  const base = existing
    ? {
        commissionPercent: storedToPercent(existing.commission),
        vatPercent: storedToPercent(existing.vat),
        marketingPercent: storedToPercent(existing.marketing),
        marketplaceServicePercent: storedToPercent(existing.marketplaceService),
      }
    : {
        commissionPercent: null,
        vatPercent: null,
        marketingPercent: null,
        marketplaceServicePercent: null,
      };

  return {
    commissionPercent: patch.commissionPercent !== undefined ? patch.commissionPercent : base.commissionPercent,
    vatPercent: patch.vatPercent !== undefined ? patch.vatPercent : base.vatPercent,
    marketingPercent: patch.marketingPercent !== undefined ? patch.marketingPercent : base.marketingPercent,
    marketplaceServicePercent:
      patch.marketplaceServicePercent !== undefined ? patch.marketplaceServicePercent : base.marketplaceServicePercent,
  };
}

export async function setCategoryFeesBulk(categoryIds: number[], patch: CategoryFeePatch) {
  if (categoryIds.length === 0) return 0;

  await connection();

  const uniqueIds = [...new Set(categoryIds)];
  const existingRows =
    uniqueIds.length > 0
      ? await db
          .select({
            categoryId: categoryCommissionRates.categoryId,
            rate: categoryCommissionRates.rate,
            vatRate: categoryCommissionRates.vatRate,
            marketingFeeRate: categoryCommissionRates.marketingFeeRate,
            marketplaceServiceFeeRate: categoryCommissionRates.marketplaceServiceFeeRate,
          })
          .from(categoryCommissionRates)
          .where(
            and(inArray(categoryCommissionRates.categoryId, uniqueIds), isNull(categoryCommissionRates.effectiveTo)),
          )
      : [];

  const existingByCategory = new Map(existingRows.map((r) => [r.categoryId, rowToFees(r)]));
  let updated = 0;

  await db.transaction(async (tx) => {
    for (const categoryId of uniqueIds) {
      const fees = mergeFeePatch(existingByCategory.get(categoryId), patch);

      const open = await tx
        .select({ id: categoryCommissionRates.id })
        .from(categoryCommissionRates)
        .where(and(eq(categoryCommissionRates.categoryId, categoryId), isNull(categoryCommissionRates.effectiveTo)))
        .limit(1);

      if (feesEmpty(fees)) {
        if (open[0]) await tx.delete(categoryCommissionRates).where(eq(categoryCommissionRates.id, open[0].id));
        continue;
      }

      const values = {
        rate: toStoredRate(fees.commissionPercent),
        vatRate: toStoredRate(fees.vatPercent),
        marketingFeeRate: toStoredRate(fees.marketingPercent),
        marketplaceServiceFeeRate: toStoredRate(fees.marketplaceServicePercent),
      };

      if (open[0]) {
        await tx.update(categoryCommissionRates).set(values).where(eq(categoryCommissionRates.id, open[0].id));
      } else {
        await tx.insert(categoryCommissionRates).values({ categoryId, ...values });
      }
      updated++;
    }
  });

  return updated;
}
