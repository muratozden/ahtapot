CREATE TYPE "public"."agent_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."fetch_mode" AS ENUM('fetch', 'tab');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'leased', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('active', 'paused', 'not_found', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'seller');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"password" text,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" "agent_status" DEFAULT 'active' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"last_ip" "inet",
	"user_agent" text,
	"extension_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agents_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "listings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"marketplace_id" text NOT NULL,
	"external_key" text NOT NULL,
	"canonical_url" text NOT NULL,
	"title" text,
	"brand" text,
	"image_url" text,
	"status" "listing_status" DEFAULT 'active' NOT NULL,
	"last_price" numeric(12, 2),
	"last_currency" char(3),
	"last_in_stock" boolean,
	"last_seller_name" text,
	"last_checked_at" timestamp with time zone,
	"last_changed_at" timestamp with time zone,
	"check_interval_minutes" integer DEFAULT 360 NOT NULL,
	"next_check_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"default_mode" "fetch_mode" DEFAULT 'fetch' NOT NULL,
	"min_delay_ms" integer DEFAULT 5000 NOT NULL,
	CONSTRAINT "marketplaces_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "price_snapshots" (
	"listing_id" bigint NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"price" numeric(12, 2),
	"list_price" numeric(12, 2),
	"currency" char(3) DEFAULT 'TRY' NOT NULL,
	"in_stock" boolean,
	"seller_name" text,
	"agent_id" uuid,
	"raw_ref" text,
	CONSTRAINT "price_snapshots_listing_id_observed_at_pk" PRIMARY KEY("listing_id","observed_at")
);
--> statement-breakpoint
CREATE TABLE "scrape_jobs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "scrape_jobs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"listing_id" bigint NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"mode" "fetch_mode" DEFAULT 'fetch' NOT NULL,
	"priority" smallint DEFAULT 0 NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"leased_by" uuid,
	"lease_expires_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tracked_listings" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tracked_listings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"seller_id" text NOT NULL,
	"listing_id" bigint NOT NULL,
	"label" text,
	"check_interval_minutes" integer DEFAULT 360 NOT NULL,
	"target_price" numeric(12, 2),
	"alert_on_change" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'seller' NOT NULL,
	"company_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_marketplace_id_marketplaces_id_fk" FOREIGN KEY ("marketplace_id") REFERENCES "public"."marketplaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_jobs" ADD CONSTRAINT "scrape_jobs_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_jobs" ADD CONSTRAINT "scrape_jobs_leased_by_agents_id_fk" FOREIGN KEY ("leased_by") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_listings" ADD CONSTRAINT "tracked_listings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_listings" ADD CONSTRAINT "tracked_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "listings_marketplace_key_uq" ON "listings" USING btree ("marketplace_id","external_key");--> statement-breakpoint
CREATE INDEX "listings_next_check_idx" ON "listings" USING btree ("next_check_at") WHERE "listings"."status" = 'active';--> statement-breakpoint
CREATE INDEX "scrape_jobs_pending_idx" ON "scrape_jobs" USING btree ("priority" DESC NULLS LAST,"scheduled_at") WHERE "scrape_jobs"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "scrape_jobs_open_listing_uq" ON "scrape_jobs" USING btree ("listing_id") WHERE "scrape_jobs"."status" in ('pending', 'leased');--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tracked_listings_seller_listing_uq" ON "tracked_listings" USING btree ("seller_id","listing_id");--> statement-breakpoint
CREATE INDEX "tracked_listings_listing_idx" ON "tracked_listings" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");