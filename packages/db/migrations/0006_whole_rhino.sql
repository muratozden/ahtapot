CREATE TABLE "marketplace_sellers" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "marketplace_sellers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"marketplace_id" text NOT NULL,
	"external_seller_id" text NOT NULL,
	"store_name" text,
	"store_url" text,
	"commercial_title" text,
	"location" text,
	"address" text,
	"mersis_no" text,
	"tax_id" text,
	"phone" text,
	"avg_shipping_days" numeric(8, 2),
	"avg_message_response_hours" numeric(8, 2),
	"rating" numeric(4, 2),
	"product_count" integer,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketplace_sellers" ADD CONSTRAINT "marketplace_sellers_marketplace_id_marketplaces_id_fk" FOREIGN KEY ("marketplace_id") REFERENCES "public"."marketplaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "marketplace_sellers_mp_ext_uq" ON "marketplace_sellers" USING btree ("marketplace_id","external_seller_id");--> statement-breakpoint
CREATE INDEX "marketplace_sellers_mp_idx" ON "marketplace_sellers" USING btree ("marketplace_id");