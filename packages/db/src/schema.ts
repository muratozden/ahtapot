import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  index,
  inet,
  integer,
  date,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const userRoles = ["admin", "seller"] as const;
export type UserRole = (typeof userRoles)[number];

export const userRole = pgEnum("user_role", userRoles);
export const listingStatus = pgEnum("listing_status", ["active", "paused", "not_found", "blocked"]);
export const agentStatus = pgEnum("agent_status", ["active", "disabled"]);
export const jobStatus = pgEnum("job_status", ["pending", "leased", "done", "failed"]);
export const fetchMode = pgEnum("fetch_mode", ["fetch", "tab"]);

// Auth tables follow the Better Auth core schema (user, session, account, verification).

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRole("role").notNull().default("seller"),
  companyName: text("company_name"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    password: text("password"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("accounts_user_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

export const marketplaces = pgTable("marketplaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  defaultMode: fetchMode("default_mode").notNull().default("fetch"),
  minDelayMs: integer("min_delay_ms").notNull().default(5000),
});

/** Marketplace category trees (imported reference data for commission mapping). */
export const marketplaceCategories = pgTable(
  "marketplace_categories",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    marketplaceId: text("marketplace_id")
      .notNull()
      .references(() => marketplaces.id),
    externalId: text("external_id").notNull(),
    parentId: bigint("parent_id", { mode: "number" }),
    name: text("name").notNull(),
    path: text("path").notNull(),
    isLeaf: boolean("is_leaf").notNull(),
    depth: smallint("depth"),
    treeVersion: text("tree_version").notNull(),
    importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("marketplace_categories_mp_ext_ver_uq").on(t.marketplaceId, t.externalId, t.treeVersion),
    index("marketplace_categories_mp_parent_idx").on(t.marketplaceId, t.parentId),
    index("marketplace_categories_mp_ver_idx").on(t.marketplaceId, t.treeVersion),
  ],
);

/** Open row per category (effective_to IS NULL): commission and fee rates as decimals (0.15 = 15%). */
export const categoryCommissionRates = pgTable(
  "category_commission_rates",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    categoryId: bigint("category_id", { mode: "number" })
      .notNull()
      .references(() => marketplaceCategories.id, { onDelete: "cascade" }),
    rate: numeric("rate", { precision: 6, scale: 4 }),
    vatRate: numeric("vat_rate", { precision: 6, scale: 4 }),
    marketingFeeRate: numeric("marketing_fee_rate", { precision: 6, scale: 4 }),
    marketplaceServiceFeeRate: numeric("marketplace_service_fee_rate", { precision: 6, scale: 4 }),
    effectiveFrom: date("effective_from").notNull().defaultNow(),
    effectiveTo: date("effective_to"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("category_commission_rates_category_idx").on(t.categoryId),
    uniqueIndex("category_commission_rates_open_uq")
      .on(t.categoryId)
      .where(sql`${t.effectiveTo} is null`),
  ],
);

/** One row per unique product page, shared by every tenant that tracks it. */
export const listings = pgTable(
  "listings",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    marketplaceId: text("marketplace_id")
      .notNull()
      .references(() => marketplaces.id),
    externalKey: text("external_key").notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    title: text("title"),
    brand: text("brand"),
    imageUrl: text("image_url"),
    status: listingStatus("status").notNull().default("active"),
    lastPrice: numeric("last_price", { precision: 12, scale: 2 }),
    lastCurrency: char("last_currency", { length: 3 }),
    lastInStock: boolean("last_in_stock"),
    lastSellerName: text("last_seller_name"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    lastChangedAt: timestamp("last_changed_at", { withTimezone: true }),
    checkIntervalMinutes: integer("check_interval_minutes").notNull().default(360),
    nextCheckAt: timestamp("next_check_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("listings_marketplace_key_uq").on(t.marketplaceId, t.externalKey),
    index("listings_next_check_idx").on(t.nextCheckAt).where(sql`${t.status} = 'active'`),
  ],
);

export const trackedListings = pgTable(
  "tracked_listings",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    sellerId: text("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listingId: bigint("listing_id", { mode: "number" })
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    label: text("label"),
    checkIntervalMinutes: integer("check_interval_minutes").notNull().default(360),
    targetPrice: numeric("target_price", { precision: 12, scale: 2 }),
    alertOnChange: boolean("alert_on_change").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("tracked_listings_seller_listing_uq").on(t.sellerId, t.listingId),
    index("tracked_listings_listing_idx").on(t.listingId),
  ],
);

/** Browser extensions running on our own devices. */
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  status: agentStatus("status").notNull().default("active"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  lastIp: inet("last_ip"),
  userAgent: text("user_agent"),
  extensionVersion: text("extension_version"),
  createdAt: createdAt(),
});

export const scrapeJobs = pgTable(
  "scrape_jobs",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    listingId: bigint("listing_id", { mode: "number" })
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    status: jobStatus("status").notNull().default("pending"),
    mode: fetchMode("mode").notNull().default("fetch"),
    priority: smallint("priority").notNull().default(0),
    attempts: smallint("attempts").notNull().default(0),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull().defaultNow(),
    leasedBy: uuid("leased_by").references(() => agents.id, { onDelete: "set null" }),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [
    index("scrape_jobs_pending_idx")
      .on(t.priority.desc(), t.scheduledAt)
      .where(sql`${t.status} = 'pending'`),
    uniqueIndex("scrape_jobs_open_listing_uq")
      .on(t.listingId)
      .where(sql`${t.status} in ('pending', 'leased')`),
  ],
);

/** TimescaleDB hypertable; see the custom migration for hypertable, compression and aggregates. */
export const priceSnapshots = pgTable(
  "price_snapshots",
  {
    listingId: bigint("listing_id", { mode: "number" })
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    price: numeric("price", { precision: 12, scale: 2 }),
    listPrice: numeric("list_price", { precision: 12, scale: 2 }),
    currency: char("currency", { length: 3 }).notNull().default("TRY"),
    inStock: boolean("in_stock"),
    sellerName: text("seller_name"),
    agentId: uuid("agent_id"),
    rawRef: text("raw_ref"),
  },
  (t) => [primaryKey({ columns: [t.listingId, t.observedAt] })],
);
