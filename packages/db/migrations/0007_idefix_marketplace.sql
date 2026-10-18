INSERT INTO "marketplaces" ("id", "name", "domain", "default_mode", "min_delay_ms") VALUES
  ('idefix', 'Idefix', 'idefix.com', 'fetch', 5000)
ON CONFLICT ("id") DO NOTHING;
