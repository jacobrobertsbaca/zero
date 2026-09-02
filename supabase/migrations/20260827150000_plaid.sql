CREATE TABLE "public"."plaid_items" (
  "id"                uuid        NOT NULL DEFAULT gen_random_uuid(),
  "owner"             uuid        NOT NULL,
  "item_id"           text        NOT NULL,

  /* NULL for an inactive connection */
  "access_token"      text,

  /* Possible values: active, inactive, login-required */
  "status"            text        NOT NULL DEFAULT 'active',
  
  "institution_id"    text        NOT NULL,
  "institution_name"  text        NOT NULL,
  "institution_logo"  text,
  "transactions_cursor" text,
  "created_at"        timestamptz NOT NULL DEFAULT now(),
  "updated_at"        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "plaid_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "plaid_items_owner_fkey" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  CONSTRAINT "plaid_items_item_id_key" UNIQUE ("item_id")
);

CREATE TABLE "public"."plaid_accounts" (
  "id"              uuid        NOT NULL DEFAULT gen_random_uuid(),
  "owner"           uuid        NOT NULL,
  "item_id"         uuid        NOT NULL,
  "account_id"      text        NOT NULL,
  "persistent_account_id" text,
  "name"            text        NOT NULL,
  "official_name"   text,
  "type"            text        NOT NULL,
  "subtype"         text,
  "mask"            text,
  "status"          text        NOT NULL DEFAULT 'active',
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  "updated_at"      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "plaid_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "plaid_accounts_owner_fkey" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  CONSTRAINT "plaid_accounts_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."plaid_items"("id") ON DELETE CASCADE,
  CONSTRAINT "plaid_accounts_account_id_key" UNIQUE ("account_id")
);

ALTER TABLE "public"."plaid_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."plaid_accounts" ENABLE ROW LEVEL SECURITY;
