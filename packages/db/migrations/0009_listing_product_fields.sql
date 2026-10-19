ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "marketplace_category_id" bigint;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "category_external_id" text;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "category_path" text;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "rating" numeric(3, 2);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "review_count" integer;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "listings" ADD CONSTRAINT "listings_marketplace_category_id_marketplace_categories_id_fk"
    FOREIGN KEY ("marketplace_category_id") REFERENCES "public"."marketplace_categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
