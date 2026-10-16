CREATE EXTENSION IF NOT EXISTS timescaledb;
--> statement-breakpoint
SELECT create_hypertable('price_snapshots', by_range('observed_at', INTERVAL '7 days'));
--> statement-breakpoint
ALTER TABLE price_snapshots SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'listing_id',
  timescaledb.compress_orderby = 'observed_at DESC'
);
--> statement-breakpoint
SELECT add_compression_policy('price_snapshots', INTERVAL '30 days');
--> statement-breakpoint
CREATE MATERIALIZED VIEW price_daily
WITH (timescaledb.continuous) AS
SELECT
  listing_id,
  time_bucket(INTERVAL '1 day', observed_at) AS day,
  min(price) AS min_price,
  max(price) AS max_price,
  avg(price)::numeric(12, 2) AS avg_price,
  last(price, observed_at) AS close_price,
  bool_or(in_stock) AS was_in_stock,
  count(*) AS samples
FROM price_snapshots
GROUP BY listing_id, day
WITH NO DATA;
--> statement-breakpoint
SELECT add_continuous_aggregate_policy('price_daily',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour');
--> statement-breakpoint
INSERT INTO marketplaces (id, name, domain, default_mode, min_delay_ms) VALUES
  ('trendyol', 'Trendyol', 'trendyol.com', 'fetch', 5000),
  ('hepsiburada', 'Hepsiburada', 'hepsiburada.com', 'tab', 6000),
  ('amazon_tr', 'Amazon Türkiye', 'amazon.com.tr', 'fetch', 8000),
  ('n11', 'n11', 'n11.com', 'fetch', 5000)
ON CONFLICT (id) DO NOTHING;
