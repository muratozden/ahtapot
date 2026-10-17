import "server-only";
import { schema } from "@ahtapot/db";
import { desc, eq, sql, type SQL } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "./db";
import { requireRole } from "./session";

const { users, trackedListings, agents, scrapeJobs, marketplaces } = schema;

const count = (filter?: SQL) =>
  filter ? sql<number>`count(*) filter (where ${filter})::int` : sql<number>`count(*)::int`;

export async function getAdminOverview() {
  await requireRole("admin");
  await connection();

  const [[sellerStats], [trackedStats], [agentStats], [jobStats], marketplaceStats, recentSellers] =
    await Promise.all([
      db
        .select({
          total: count(),
          newThisWeek: count(sql`${users.createdAt} > now() - interval '7 days'`),
        })
        .from(users)
        .where(eq(users.role, "seller")),

      db
        .select({
          tracked: count(sql`${trackedListings.isActive}`),
          uniqueListings: sql<number>`count(distinct ${trackedListings.listingId})::int`,
        })
        .from(trackedListings),

      db
        .select({
          active: count(sql`${agents.status} = 'active'`),
          online: count(sql`${agents.status} = 'active' and ${agents.lastSeenAt} > now() - interval '10 minutes'`),
        })
        .from(agents),

      db
        .select({
          done: count(sql`${scrapeJobs.status} = 'done'`),
          failed: count(sql`${scrapeJobs.status} = 'failed'`),
        })
        .from(scrapeJobs)
        .where(sql`${scrapeJobs.finishedAt} > now() - interval '24 hours'`),

      db
        .select({
          id: marketplaces.id,
          name: marketplaces.name,
          isActive: marketplaces.isActive,
          // Drizzle drops table prefixes in single-table selects, so subqueries use explicit aliases.
          listings: sql<number>`(
            select count(*)::int from listings l where l.marketplace_id = marketplaces.id
          )`,
          done24h: sql<number>`(
            select count(*)::int from scrape_jobs j
            join listings l on l.id = j.listing_id
            where l.marketplace_id = marketplaces.id
              and j.status = 'done' and j.finished_at > now() - interval '24 hours'
          )`,
          failed24h: sql<number>`(
            select count(*)::int from scrape_jobs j
            join listings l on l.id = j.listing_id
            where l.marketplace_id = marketplaces.id
              and j.status = 'failed' and j.finished_at > now() - interval '24 hours'
          )`,
        })
        .from(marketplaces)
        .orderBy(marketplaces.name),

      db
        .select({ id: users.id, name: users.name, companyName: users.companyName, createdAt: users.createdAt })
        .from(users)
        .where(eq(users.role, "seller"))
        .orderBy(desc(users.createdAt))
        .limit(5),
    ]);

  return { sellerStats, trackedStats, agentStats, jobStats, marketplaceStats, recentSellers };
}
