import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from "plaid";
import { wrap } from "src/server/common";
import { HttpError } from "src/server/errors";
import { getSubscription } from "src/server/billing";
import { tags } from "src/server/tags";
import { ExchangePlaidPublicTokenSchema } from "src/types/plaid/schema";
import type { PlaidAccount, PlaidConnection, PlaidConnections } from "src/types/plaid/types";
import { supabase } from "src/utils/supabase/server";
import { z } from "zod";

export const MAX_PLAID_ITEMS = 4;

export const isPlaidConfigured = () => Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);

const plaidEnvironment = () => {
  switch (process.env.PLAID_ENV) {
    case "production":
      return PlaidEnvironments.production;
    case "development":
      return PlaidEnvironments.development;
    default:
      return PlaidEnvironments.sandbox;
  }
};

let _plaid: PlaidApi | undefined;
const plaid = () => {
  if (!isPlaidConfigured()) throw new Error("Plaid is not configured.");
  return (_plaid ??= new PlaidApi(
    new Configuration({
      basePath: plaidEnvironment(),
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
          "PLAID-SECRET": process.env.PLAID_SECRET!,
        },
      },
    })
  ));
};

const requirePlus = async (owner: string) => {
  const subscription = await getSubscription(owner);
  if (!subscription.active) throw new HttpError("forbidden", "Plus subscription required to connect accounts.");
};

const mapAccount = (row: {
  id: string;
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
}): PlaidAccount => ({
  id: row.id,
  accountId: row.account_id,
  name: row.name,
  officialName: row.official_name,
  type: row.type,
  subtype: row.subtype,
  mask: row.mask,
});

export const getPlaidConnections = async (owner: string): Promise<PlaidConnections> => {
  "use cache";
  cacheTag(tags.plaid(owner));
  cacheLife("max");

  const { data: items, error: itemsError } = await supabase
    .from("plaid_items")
    .select("id, item_id, institution_id, institution_name, status, created_at")
    .eq("owner", owner)
    .order("created_at", { ascending: true });
  if (itemsError) throw new HttpError(itemsError.code, itemsError.message);

  if (!items?.length) return { connections: [], limit: MAX_PLAID_ITEMS };

  const itemIds = items.map((item) => item.id);
  const { data: accounts, error: accountsError } = await supabase
    .from("plaid_accounts")
    .select("id, plaid_item_id, account_id, name, official_name, type, subtype, mask")
    .eq("owner", owner)
    .in("plaid_item_id", itemIds)
    .order("name", { ascending: true });
  if (accountsError) throw new HttpError(accountsError.code, accountsError.message);

  const accountsByItem = new Map<string, PlaidAccount[]>();
  for (const account of accounts ?? []) {
    const mapped = mapAccount(account);
    const list = accountsByItem.get(account.plaid_item_id) ?? [];
    list.push(mapped);
    accountsByItem.set(account.plaid_item_id, list);
  }

  const connections: PlaidConnection[] = items.map((item) => ({
    id: item.id,
    itemId: item.item_id,
    institutionId: item.institution_id,
    institutionName: item.institution_name,
    status: item.status,
    createdAt: item.created_at,
    accounts: accountsByItem.get(item.id) ?? [],
  }));

  return { connections, limit: MAX_PLAID_ITEMS };
};

export const createLinkToken = async (owner: string): Promise<string> => {
  await requirePlus(owner);

  const connections = await getPlaidConnections(owner);
  if (connections.connections.length >= MAX_PLAID_ITEMS) {
    throw new HttpError("limit_reached", `You can connect up to ${MAX_PLAID_ITEMS} institutions.`);
  }

  const response = await plaid().linkTokenCreate({
    user: { client_user_id: owner },
    client_name: "Zero",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  });

  return response.data.link_token;
};

export const exchangePublicToken = async (
  owner: string,
  input: z.infer<typeof ExchangePlaidPublicTokenSchema>
): Promise<PlaidConnection> => {
  await requirePlus(owner);

  const parsed = ExchangePlaidPublicTokenSchema.parse(input);
  const connections = await getPlaidConnections(owner);
  if (connections.connections.length >= MAX_PLAID_ITEMS) {
    throw new HttpError("limit_reached", `You can connect up to ${MAX_PLAID_ITEMS} institutions.`);
  }

  const exchange = await plaid().itemPublicTokenExchange({ public_token: parsed.publicToken });
  const { access_token: accessToken, item_id: itemId } = exchange.data;

  const { data: existing } = await supabase.from("plaid_items").select("id").eq("item_id", itemId).maybeSingle();
  if (existing) throw new HttpError("conflict", "This institution is already connected.");

  const [itemResponse, accountsResponse] = await Promise.all([
    plaid().itemGet({ access_token: accessToken }),
    plaid().accountsGet({ access_token: accessToken }),
  ]);

  const institutionId = itemResponse.data.item.institution_id;
  if (!institutionId) throw new HttpError("invalid_item", "Institution could not be determined.");

  const institutionResponse = await plaid().institutionsGetById({
    institution_id: institutionId,
    country_codes: [CountryCode.Us],
  });
  const institutionName = institutionResponse.data.institution.name;
  const plaidAccounts = accountsResponse.data.accounts;
  if (!plaidAccounts.length) throw new HttpError("no_accounts", "No accounts were found for this institution.");

  const now = new Date().toISOString();
  const { data: item, error: itemError } = await supabase
    .from("plaid_items")
    .insert({
      owner,
      item_id: itemId,
      access_token: accessToken,
      institution_id: institutionId,
      institution_name: institutionName,
      status: "active",
      updated_at: now,
    })
    .select("id, item_id, institution_id, institution_name, status, created_at")
    .single();
  if (itemError) throw new HttpError(itemError.code, itemError.message);

  const accountRows = plaidAccounts.map((account) => ({
    owner,
    plaid_item_id: item.id,
    account_id: account.account_id,
    name: account.name,
    official_name: account.official_name ?? null,
    type: account.type,
    subtype: account.subtype ?? null,
    mask: account.mask ?? null,
    updated_at: now,
  }));

  const { data: insertedAccounts, error: accountsError } = await supabase
    .from("plaid_accounts")
    .insert(accountRows)
    .select("id, account_id, name, official_name, type, subtype, mask");
  if (accountsError) throw new HttpError(accountsError.code, accountsError.message);

  revalidateTag(tags.plaid(owner), { expire: 0 });

  return {
    id: item.id,
    itemId: item.item_id,
    institutionId: item.institution_id,
    institutionName: item.institution_name,
    status: item.status,
    createdAt: item.created_at,
    accounts: (insertedAccounts ?? []).map(mapAccount),
  };
};

export const removePlaidItem = async (owner: string, connectionId: string): Promise<void> => {
  const id = z.string().uuid().parse(connectionId);

  const { data: item, error } = await supabase
    .from("plaid_items")
    .select("id, access_token")
    .eq("owner", owner)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new HttpError(error.code, error.message);
  if (!item) throw new HttpError("not_found", "Connection not found.");

  try {
    await plaid().itemRemove({ access_token: item.access_token });
  } catch (err) {
    console.error("Plaid itemRemove failed:", err);
  }

  await wrap(supabase.from("plaid_items").delete().eq("id", id).eq("owner", owner));
  revalidateTag(tags.plaid(owner), { expire: 0 });
};
