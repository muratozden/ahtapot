ALTER TABLE "category_commission_rates" ALTER COLUMN "rate" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "category_commission_rates" ADD COLUMN "vat_rate" numeric(6, 4);--> statement-breakpoint
ALTER TABLE "category_commission_rates" ADD COLUMN "marketing_fee_rate" numeric(6, 4);--> statement-breakpoint
ALTER TABLE "category_commission_rates" ADD COLUMN "marketplace_service_fee_rate" numeric(6, 4);