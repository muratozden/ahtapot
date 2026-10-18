import "server-only";
import { schema, MARKETPLACE_CATEGORY_TREE_VERSION } from "@ahtapot/db";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "./db";
import { requireRole } from "./session";

const { marketplaceCategories, marketplaces } = schema;

const PAGE_SIZE = 50;

export type CategoryListParams = {
  marketplaceId: string;
  q?: string;
  page?: number;
};

export async function listMarketplacesForCategories() {
  await requireRole("admin");
  await connection();
  return db
    .select({ id: marketplaces.id, name: marketplaces.name })
    .from(marketplaces)
    .orderBy(marketplaces.name);
}

export async function getCategoryListSummary(marketplaceId: string) {
  await requireRole("admin");
  await connection();

  const base = and(
    eq(marketplaceCategories.marketplaceId, marketplaceId),
    eq(marketplaceCategories.treeVersion, MARKETPLACE_CATEGORY_TREE_VERSION),
  );

  const [[totals], [leaves]] = await Promise.all([
    db.select({ n: count() }).from(marketplaceCategories).where(base),
    db.select({ n: count() }).from(marketplaceCategories).where(and(base, eq(marketplaceCategories.isLeaf, true))),
  ]);

  return { total: totals.n, leaves: leaves.n };
}

export async function listMarketplaceCategories({ marketplaceId, q, page = 1 }: CategoryListParams) {
  await requireRole("admin");
  await connection();

  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * PAGE_SIZE;

  const base = and(
    eq(marketplaceCategories.marketplaceId, marketplaceId),
    eq(marketplaceCategories.treeVersion, MARKETPLACE_CATEGORY_TREE_VERSION),
  );

  const search = q?.trim();
  const where = search
    ? and(base, or(ilike(marketplaceCategories.path, `%${search}%`), ilike(marketplaceCategories.name, `%${search}%`)))
    : base;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: marketplaceCategories.id,
        externalId: marketplaceCategories.externalId,
        name: marketplaceCategories.name,
        path: marketplaceCategories.path,
        isLeaf: marketplaceCategories.isLeaf,
        depth: marketplaceCategories.depth,
      })
      .from(marketplaceCategories)
      .where(where)
      .orderBy(marketplaceCategories.path)
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ n: count() }).from(marketplaceCategories).where(where),
  ]);

  const total = totalRow.n;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return { rows, total, page: safePage, pageCount, pageSize: PAGE_SIZE };
}

export type CategoryPickerRow = {
  id: number;
  name: string;
  path: string;
  isLeaf: boolean;
};

export type BulkFeeScope = "self" | "subtree";

const categoryPickerColumns = {
  id: marketplaceCategories.id,
  name: marketplaceCategories.name,
  path: marketplaceCategories.path,
  isLeaf: marketplaceCategories.isLeaf,
  marketplaceId: marketplaceCategories.marketplaceId,
};

export async function searchCategoriesForPicker(marketplaceId: string, q: string, limit = 12): Promise<CategoryPickerRow[]> {
  await requireRole("admin");
  await connection();

  const term = q.trim();
  if (term.length < 2) return [];

  const base = and(
    eq(marketplaceCategories.marketplaceId, marketplaceId),
    eq(marketplaceCategories.treeVersion, MARKETPLACE_CATEGORY_TREE_VERSION),
    or(ilike(marketplaceCategories.path, `%${term}%`), ilike(marketplaceCategories.name, `%${term}%`)),
  );

  return db
    .select({
      id: categoryPickerColumns.id,
      name: categoryPickerColumns.name,
      path: categoryPickerColumns.path,
      isLeaf: categoryPickerColumns.isLeaf,
    })
    .from(marketplaceCategories)
    .where(base)
    .orderBy(marketplaceCategories.path)
    .limit(limit);
}

export async function resolveBulkFeeTargetIds(categoryId: number, scope: BulkFeeScope, leavesOnly: boolean) {
  await requireRole("admin");
  await connection();

  const [anchor] = await db
    .select({
      id: categoryPickerColumns.id,
      path: categoryPickerColumns.path,
      isLeaf: categoryPickerColumns.isLeaf,
      marketplaceId: categoryPickerColumns.marketplaceId,
    })
    .from(marketplaceCategories)
    .where(
      and(
        eq(marketplaceCategories.id, categoryId),
        eq(marketplaceCategories.treeVersion, MARKETPLACE_CATEGORY_TREE_VERSION),
      ),
    );

  if (!anchor) return [];

  if (scope === "self") {
    if (leavesOnly && !anchor.isLeaf) return [];
    return [anchor.id];
  }

  const pathPrefix = `${anchor.path} > %`;
  const treeFilter = or(eq(marketplaceCategories.path, anchor.path), ilike(marketplaceCategories.path, pathPrefix));

  const where = leavesOnly
    ? and(
        eq(marketplaceCategories.marketplaceId, anchor.marketplaceId),
        eq(marketplaceCategories.treeVersion, MARKETPLACE_CATEGORY_TREE_VERSION),
        treeFilter,
        eq(marketplaceCategories.isLeaf, true),
      )
    : and(
        eq(marketplaceCategories.marketplaceId, anchor.marketplaceId),
        eq(marketplaceCategories.treeVersion, MARKETPLACE_CATEGORY_TREE_VERSION),
        treeFilter,
      );

  const rows = await db.select({ id: marketplaceCategories.id }).from(marketplaceCategories).where(where);
  return rows.map((r) => r.id);
}
