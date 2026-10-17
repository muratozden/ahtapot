import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { and, eq } from "drizzle-orm";
import { createDb, schema } from "../src/index.ts";
import { MARKETPLACE_CATEGORY_TREE_VERSION } from "../src/category-tree-version.ts";

const { marketplaceCategories } = schema;

const COPY_MARKERS: Record<string, string> = {
  trendyol: "COPY public.trendyol_categories ",
  n11: "COPY public.n11_categories ",
  hepsiburada: "COPY public.hepsiburada_categories ",
};

type RawRow = { externalId: string; parentExternalId: string | null; name: string; path: string; isLeaf: boolean };

const { values: args } = parseArgs({
  options: {
    file: { type: "string", default: resolve(import.meta.dirname, "../../../_temp/category.sql") },
    version: { type: "string", default: MARKETPLACE_CATEGORY_TREE_VERSION },
  },
});

function pathDepth(path: string) {
  return path.split(" > ").length;
}

async function parseCopySection(file: string, marker: string): Promise<RawRow[]> {
  const rows: RawRow[] = [];
  const rl = createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
  let inSection = false;

  for await (const line of rl) {
    if (!inSection) {
      if (line.startsWith(marker)) inSection = true;
      continue;
    }
    if (line === "\\.") break;
    const [ , externalId, parentId, name, path, isLeaf] = line.split("\t");
    if (!externalId || !name || !path) continue;
    rows.push({
      externalId,
      parentExternalId: parentId === "\\N" ? null : parentId,
      name,
      path,
      isLeaf: isLeaf === "t",
    });
  }

  return rows;
}

async function importMarketplace(
  db: ReturnType<typeof createDb>,
  marketplaceId: string,
  rows: RawRow[],
  treeVersion: string,
) {
  await db
    .delete(marketplaceCategories)
    .where(and(eq(marketplaceCategories.marketplaceId, marketplaceId), eq(marketplaceCategories.treeVersion, treeVersion)));

  const extToId = new Map<string, number>();
  const batchSize = 400;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const inserted = await db
      .insert(marketplaceCategories)
      .values(
        batch.map((r) => ({
          marketplaceId,
          externalId: r.externalId,
          parentId: null,
          name: r.name,
          path: r.path,
          isLeaf: r.isLeaf,
          depth: pathDepth(r.path),
          treeVersion,
        })),
      )
      .returning({ id: marketplaceCategories.id, externalId: marketplaceCategories.externalId });

    for (const row of inserted) extToId.set(row.externalId, row.id);
  }

  const links: { childId: number; parentId: number }[] = [];
  let orphanRows = 0;
  for (const r of rows) {
    if (!r.parentExternalId) continue;
    const childId = extToId.get(r.externalId);
    const parentId = extToId.get(r.parentExternalId);
    if (!childId || !parentId) {
      orphanRows++;
      continue;
    }
    links.push({ childId, parentId });
  }

  for (let i = 0; i < links.length; i += batchSize) {
    const chunk = links.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(({ childId, parentId }) =>
        db.update(marketplaceCategories).set({ parentId }).where(eq(marketplaceCategories.id, childId)),
      ),
    );
  }

  return { total: rows.length, linkedParents: links.length, orphans: orphanRows };
}

async function main() {
  const file = args.file!;
  const version = args.version!;
  const db = createDb();

  console.log(`Importing from ${file} (tree_version=${version})`);

  for (const [marketplaceId, marker] of Object.entries(COPY_MARKERS)) {
    const rows = await parseCopySection(file, marker);
    if (rows.length === 0) {
      console.warn(`  ${marketplaceId}: no rows (check file path)`);
      continue;
    }
    const stats = await importMarketplace(db, marketplaceId, rows, version);
    console.log(
      `  ${marketplaceId}: ${stats.total} categories, ${stats.linkedParents} parent links, ${stats.orphans} rows with missing parent id in dump`,
    );
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
