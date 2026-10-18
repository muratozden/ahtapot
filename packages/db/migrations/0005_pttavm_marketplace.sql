INSERT INTO "marketplaces" ("id", "name", "domain", "default_mode", "min_delay_ms") VALUES
  ('pttavm', 'PTT AVM', 'pttavm.com.tr', 'fetch', 5000)
ON CONFLICT ("id") DO NOTHING;
