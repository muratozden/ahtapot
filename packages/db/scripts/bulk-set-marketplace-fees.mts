import { parseArgs } from "node:util";
import { and, eq, isNull } from "drizzle-orm";
import { createDb, MARKETPLACE_CATEGORY_TREE_VERSION, schema } from "../src/index.ts";

const { marketplaceCategories, categoryCommissionRates } = schema;

function toStoredRate(percent: number) {
  return (percent / 100).toFixed(4);
}

const { values: args } = parseArgs({
  options: {
    marketplace: { type: "string" },
    marketing: { type: "string" },
    "marketplace-service": { type: "string" },
    commission: { type: "string" },
    vat: { type: "string" },
    version: { type: "string", default: MARKETPLACE_CATEGORY_TREE_VERSION },
  },
});

function parsePercent(label: string, raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n)) throw new Error(`Invalid ${label}: ${raw}`);
  return n;
}

async function main() {
  const marketplaceId = args.marketplace;
  if (!marketplaceId) throw new Error("--marketplace is required");

  const patch = {
    marketing: parsePercent("marketing", args.marketing),
    commission: parsePercent("commission", args.commission),
    vat: parsePercent("vat", args.vat),
    marketplaceService: parsePercent("marketplace-service", args["marketplace-service"]),
  };

  if (
    patch.marketing === undefined &&
    patch.commission === undefined &&
    patch.vat === undefined &&
    patch.marketplaceService === undefined
  ) {
    throw new Error("Set at least one of --marketing, --marketplace-service, --commission, --vat");
  }

  const treeVersion = args.version!;
  const db = createDb();

  const categories = await db
    .select({ id: marketplaceCategories.id })
    .from(marketplaceCategories)
    .where(
      and(eq(marketplaceCategories.marketplaceId, marketplaceId), eq(marketplaceCategories.treeVersion, treeVersion)),
    );

  if (categories.length === 0) {
    console.warn(`No categories for marketplace=${marketplaceId} tree_version=${treeVersion}`);
    await db.$client.end();
    return;
  }

  const marketingRate = patch.marketing !== undefined ? toStoredRate(patch.marketing) : null;
  const marketplaceServiceRate =
    patch.marketplaceService !== undefined ? toStoredRate(patch.marketplaceService) : null;
  const commissionRate = patch.commission !== undefined ? toStoredRate(patch.commission) : null;
  const vatRate = patch.vat !== undefined ? toStoredRate(patch.vat) : null;

  let updated = 0;
  let inserted = 0;

  await db.transaction(async (tx) => {
    for (const { id: categoryId } of categories) {
      const open = await tx
        .select({ id: categoryCommissionRates.id })
        .from(categoryCommissionRates)
        .where(and(eq(categoryCommissionRates.categoryId, categoryId), isNull(categoryCommissionRates.effectiveTo)))
        .limit(1);

      const setParts: Record<string, string | null> = {};
      if (marketingRate !== null) setParts.marketingFeeRate = marketingRate;
      if (marketplaceServiceRate !== null) setParts.marketplaceServiceFeeRate = marketplaceServiceRate;
      if (commissionRate !== null) setParts.rate = commissionRate;
      if (vatRate !== null) setParts.vatRate = vatRate;

      if (open[0]) {
        await tx.update(categoryCommissionRates).set(setParts).where(eq(categoryCommissionRates.id, open[0].id));
        updated++;
      } else {
        await tx.insert(categoryCommissionRates).values({
          categoryId,
          ...(marketingRate !== null ? { marketingFeeRate: marketingRate } : {}),
          ...(marketplaceServiceRate !== null ? { marketplaceServiceFeeRate: marketplaceServiceRate } : {}),
          ...(commissionRate !== null ? { rate: commissionRate } : {}),
          ...(vatRate !== null ? { vatRate: vatRate } : {}),
        });
        inserted++;
      }
    }
  });

  console.log(
    `marketplace=${marketplaceId} tree_version=${treeVersion}: ${categories.length} categories, ${updated} updated, ${inserted} inserted`,
  );
  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
