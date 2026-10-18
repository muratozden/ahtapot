import { parseArgs } from "node:util";
import { sql } from "drizzle-orm";
import { createDb, MARKETPLACE_CATEGORY_TREE_VERSION } from "../src/index.ts";

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

  const updateSets: ReturnType<typeof sql>[] = [sql`updated_at = NOW()`];
  const insertCols: ReturnType<typeof sql>[] = [sql`category_id`];
  const insertVals: ReturnType<typeof sql>[] = [sql`mc.id`];

  if (patch.marketing !== undefined) {
    const v = toStoredRate(patch.marketing);
    updateSets.push(sql`marketing_fee_rate = ${v}`);
    insertCols.push(sql`marketing_fee_rate`);
    insertVals.push(sql`${v}`);
  }
  if (patch.marketplaceService !== undefined) {
    const v = toStoredRate(patch.marketplaceService);
    updateSets.push(sql`marketplace_service_fee_rate = ${v}`);
    insertCols.push(sql`marketplace_service_fee_rate`);
    insertVals.push(sql`${v}`);
  }
  if (patch.commission !== undefined) {
    const v = toStoredRate(patch.commission);
    updateSets.push(sql`rate = ${v}`);
    insertCols.push(sql`rate`);
    insertVals.push(sql`${v}`);
  }
  if (patch.vat !== undefined) {
    const v = toStoredRate(patch.vat);
    updateSets.push(sql`vat_rate = ${v}`);
    insertCols.push(sql`vat_rate`);
    insertVals.push(sql`${v}`);
  }

  await db.transaction(async (tx) => {
    await tx.execute(sql`
      UPDATE category_commission_rates ccr
      SET ${sql.join(updateSets, sql`, `)}
      FROM marketplace_categories mc
      WHERE ccr.category_id = mc.id
        AND mc.marketplace_id = ${marketplaceId}
        AND mc.tree_version = ${treeVersion}
        AND ccr.effective_to IS NULL
    `);

    await tx.execute(sql`
      INSERT INTO category_commission_rates (${sql.join(insertCols, sql`, `)})
      SELECT ${sql.join(insertVals, sql`, `)}
      FROM marketplace_categories mc
      LEFT JOIN category_commission_rates ccr
        ON ccr.category_id = mc.id AND ccr.effective_to IS NULL
      WHERE mc.marketplace_id = ${marketplaceId}
        AND mc.tree_version = ${treeVersion}
        AND ccr.id IS NULL
    `);
  });

  const countRows = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM category_commission_rates ccr
    JOIN marketplace_categories mc ON mc.id = ccr.category_id
    WHERE mc.marketplace_id = ${marketplaceId}
      AND mc.tree_version = ${treeVersion}
      AND ccr.effective_to IS NULL
  `);

  const count = Number((countRows as { count: number }[])[0]?.count ?? 0);
  console.log(
    `marketplace=${marketplaceId} tree_version=${treeVersion}: ${count} categories with open fee rows`,
  );
  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
