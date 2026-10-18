import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import XLSX from "xlsx";
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

type PttRow = {
  sequence: number;
  id: number;
  parentId: number | null;
  name: string;
  nameTree: string;
  isLeaf: boolean;
};

const repoRoot = resolve(import.meta.dirname, "../../..");

const { values: args } = parseArgs({
  options: {
    file: { type: "string", default: resolve(repoRoot, "_temp/category.sql") },
    pttavmFile: { type: "string", default: resolve(repoRoot, "_temp/pttavm-categories.sql") },
    idefixFile: { type: "string", default: resolve(repoRoot, "_temp/idefix_categories.xlsx") },
    pazaramaFile: { type: "string", default: resolve(repoRoot, "_temp/pazarama.sql") },
    version: { type: "string", default: MARKETPLACE_CATEGORY_TREE_VERSION },
  },
});

function pathDepth(path: string) {
  return path.split(" > ").length;
}

function pttExternalId(row: Pick<PttRow, "id" | "parentId">) {
  return `${row.parentId ?? 0}:${row.id}`;
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
    const [, externalId, parentId, name, path, isLeaf] = line.split("\t");
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

const PTT_INSERT_RE =
  /INSERT INTO public\.pttavm_categories VALUES \((\d+), (\d+), (NULL|\d+), '((?:[^']|'')*)', '((?:[^']|'')*)', (true|false)\);/g;

const PAZARAMA_COPY_MARKER = "COPY public.pazarama_categories ";

/** Pazarama pg_dump: sequence, id, parentId, name, nameTree, isLeaf (UUID ids). */
async function parsePazaramaCategoriesCopy(file: string): Promise<RawRow[]> {
  const rows: RawRow[] = [];
  const rl = createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
  let inSection = false;

  for await (const line of rl) {
    if (!inSection) {
      if (line.startsWith(PAZARAMA_COPY_MARKER)) inSection = true;
      continue;
    }
    if (line === "\\.") break;
    const parts = line.split("\t");
    if (parts.length < 6) continue;
    const [, externalId, parentId, name, path, isLeaf] = parts;
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

async function parsePttavmInserts(file: string): Promise<RawRow[]> {
  const rl = createInterface({ input: createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity });
  const pttRows: PttRow[] = [];

  for await (const line of rl) {
    if (!line.startsWith("INSERT INTO public.pttavm_categories VALUES")) continue;
    PTT_INSERT_RE.lastIndex = 0;
    const m = PTT_INSERT_RE.exec(line);
    if (!m) continue;
    pttRows.push({
      sequence: Number(m[1]),
      id: Number(m[2]),
      parentId: m[3] === "NULL" ? null : Number(m[3]),
      name: m[4].replace(/''/g, "'"),
      nameTree: m[5].replace(/''/g, "'"),
      isLeaf: m[6] === "true",
    });
  }

  function resolveParent(row: PttRow): PttRow | null {
    if (row.parentId == null) return null;
    const candidates = pttRows.filter((r) => r.id === row.parentId);
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0]!;
    const byPath = candidates.find((p) => row.nameTree.startsWith(`${p.nameTree} > `));
    return byPath ?? candidates[0]!;
  }

  return pttRows.map((row) => {
    const parent = resolveParent(row);
    return {
      externalId: pttExternalId(row),
      parentExternalId: parent ? pttExternalId(parent) : null,
      name: row.name,
      path: row.nameTree,
      isLeaf: row.isLeaf,
    };
  });
}

function idefixBranchExternalId(path: string) {
  return `b:${createHash("sha256").update(path).digest("hex").slice(0, 16)}`;
}

/** Idefix export: leaf rows with id + categoryPath; branch nodes get stable hashed external_id. */
function parseIdefixXlsx(file: string): RawRow[] {
  const wb = XLSX.readFile(file);
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName]!;
  const data = XLSX.utils.sheet_to_json<{ id: number | string; name: string; categoryPath: string }>(sheet);

  type Node = {
    name: string;
    path: string;
    externalId: string;
    isLeaf: boolean;
    parentPath: string | null;
  };
  const nodeByPath = new Map<string, Node>();

  for (const row of data) {
    const path = String(row.categoryPath ?? "").trim();
    if (!path) continue;
    const parts = path
      .split(" > ")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) continue;
    const leafName = String(row.name ?? parts[parts.length - 1] ?? "").trim();
    const leafId = String(row.id).trim();

    for (let i = 0; i < parts.length; i++) {
      const subPath = parts.slice(0, i + 1).join(" > ");
      if (nodeByPath.has(subPath)) continue;
      const isLeaf = i === parts.length - 1;
      nodeByPath.set(subPath, {
        name: isLeaf ? leafName : parts[i]!,
        path: subPath,
        externalId: isLeaf ? leafId : idefixBranchExternalId(subPath),
        isLeaf,
        parentPath: i === 0 ? null : parts.slice(0, i).join(" > "),
      });
    }

    nodeByPath.set(path, {
      name: leafName,
      path,
      externalId: leafId,
      isLeaf: true,
      parentPath: parts.length > 1 ? parts.slice(0, -1).join(" > ") : null,
    });
  }

  return [...nodeByPath.values()].map((n) => ({
    externalId: n.externalId,
    parentExternalId: n.parentPath ? (nodeByPath.get(n.parentPath)?.externalId ?? null) : null,
    name: n.name,
    path: n.path,
    isLeaf: n.isLeaf,
  }));
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

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const file = args.file!;
  const pttavmFile = args.pttavmFile!;
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

  if (await fileExists(pttavmFile)) {
    const rows = await parsePttavmInserts(pttavmFile);
    if (rows.length === 0) {
      console.warn(`  pttavm: no rows in ${pttavmFile}`);
    } else {
      const stats = await importMarketplace(db, "pttavm", rows, version);
      console.log(
        `  pttavm: ${stats.total} categories, ${stats.linkedParents} parent links, ${stats.orphans} rows with missing parent id in dump`,
      );
    }
  } else {
    console.warn(`  pttavm: skipped (${pttavmFile} not found)`);
  }

  const idefixFile = args.idefixFile!;
  if (await fileExists(idefixFile)) {
    const rows = parseIdefixXlsx(idefixFile);
    if (rows.length === 0) {
      console.warn(`  idefix: no rows in ${idefixFile}`);
    } else {
      const stats = await importMarketplace(db, "idefix", rows, version);
      console.log(
        `  idefix: ${stats.total} categories, ${stats.linkedParents} parent links, ${stats.orphans} rows with missing parent id in dump`,
      );
    }
  } else {
    console.warn(`  idefix: skipped (${idefixFile} not found)`);
  }

  const pazaramaFile = args.pazaramaFile!;
  if (await fileExists(pazaramaFile)) {
    const rows = await parsePazaramaCategoriesCopy(pazaramaFile);
    if (rows.length === 0) {
      console.warn(`  pazarama: no rows in ${pazaramaFile}`);
    } else {
      const stats = await importMarketplace(db, "pazarama", rows, version);
      console.log(
        `  pazarama: ${stats.total} categories, ${stats.linkedParents} parent links, ${stats.orphans} rows with missing parent id in dump`,
      );
    }
  } else {
    console.warn(`  pazarama: skipped (${pazaramaFile} not found)`);
  }

  console.log("Done.");
  await db.$client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
