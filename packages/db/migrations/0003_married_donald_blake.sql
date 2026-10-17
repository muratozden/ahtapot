CREATE TABLE "category_commission_rates" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "category_commission_rates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"category_id" bigint NOT NULL,
	"rate" numeric(6, 4) NOT NULL,
	"effective_from" date DEFAULT now() NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_commission_rates" ADD CONSTRAINT "category_commission_rates_category_id_marketplace_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."marketplace_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_commission_rates_category_idx" ON "category_commission_rates" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "category_commission_rates_open_uq" ON "category_commission_rates" USING btree ("category_id") WHERE "category_commission_rates"."effective_to" is null;