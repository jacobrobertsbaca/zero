CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA "extensions";

CREATE INDEX "transactions_owner_idx" ON "public"."transactions" ("owner");
CREATE INDEX "transactions_default_query_idx" ON "public"."transactions" (
  "owner",
  "sync_status" DESC,
  "starred" DESC,
  "date" DESC,
  "id"
)
WHERE "sync_status" <> 'removed';

CREATE INDEX "transactions_search_idx" ON "public"."transactions" USING gin ("search" gin_trgm_ops);
CREATE INDEX "budgets_owner_idx" ON "public"."budgets" ("owner");
CREATE INDEX "categories_budget_idx" ON "public"."categories" ("budget");
