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
