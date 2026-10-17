CREATE TABLE "marketplace_categories" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "marketplace_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"marketplace_id" text NOT NULL,
	"external_id" text NOT NULL,
	"parent_id" bigint,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"is_leaf" boolean NOT NULL,
	"depth" smallint,
	"tree_version" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketplace_categories" ADD CONSTRAINT "marketplace_categories_marketplace_id_marketplaces_id_fk" FOREIGN KEY ("marketplace_id") REFERENCES "public"."marketplaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "marketplace_categories_mp_ext_ver_uq" ON "marketplace_categories" USING btree ("marketplace_id","external_id","tree_version");--> statement-breakpoint
CREATE INDEX "marketplace_categories_mp_parent_idx" ON "marketplace_categories" USING btree ("marketplace_id","parent_id");--> statement-breakpoint
CREATE INDEX "marketplace_categories_mp_ver_idx" ON "marketplace_categories" USING btree ("marketplace_id","tree_version");