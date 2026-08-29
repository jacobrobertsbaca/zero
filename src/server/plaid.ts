import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products, type AccountBase } from "plaid";
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

const fetchInstitution = async (institutionId: string) => {
  const response = await plaid().institutionsGetById({
    institution_id: institutionId,
    country_codes: [CountryCode.Us],
    options: { include_optional_metadata: true },
  });
  return response.data.institution;
};

const mapConnection = (
  item: {
    id: string;
    item_id: string;
    institution_id: string;
    institution_name: string;
    institution_logo: string | null;
    created_at: string;
  },
  accounts: PlaidAccount[]
): PlaidConnection => ({
  id: item.id,
  itemId: item.item_id,
  institutionId: item.institution_id,
  institutionName: item.institution_name,
  institutionLogo: item.institution_logo,
  createdAt: item.created_at,
  accounts,
});

type PlaidAccountRow = {
  id: string;
  owner: string;
  item_id: string | null;
  account_id: string;
  persistent_account_id: string | null;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  status: string;
};

const findExistingAccount = (
  upstream: AccountBase,
  institutionId: string,
  existing: PlaidAccountRow[],
  institutionByItemId: Map<string, string>
): PlaidAccountRow | undefined => {
  const byAccountId = existing.find((row) => row.account_id === upstream.account_id);
  if (byAccountId) return byAccountId;

  if (upstream.persistent_account_id) {
    const byPersistent = existing.find(
      (row) => row.persistent_account_id && row.persistent_account_id === upstream.persistent_account_id
    );
    if (byPersistent) return byPersistent;
  }

  const subtype = upstream.subtype ?? null;
  const mask = upstream.mask ?? null;
  return existing.find((row) => {
    if (!row.item_id) return false;
    const rowInstitutionId = institutionByItemId.get(row.item_id);
    return rowInstitutionId === institutionId && row.subtype === subtype && row.mask === mask;
  });
};

const mapAccount = (row: {
  id: string;
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  status: string;
}): PlaidAccount => ({
  id: row.id,
  accountId: row.account_id,
  name: row.name,
  officialName: row.official_name,
  type: row.type,
  subtype: row.subtype,
  mask: row.mask,
  status: row.status,
});

const syncPlaidAccountsForItem = async (
  owner: string,
  item: { id: string; access_token: string; institution_id: string }
): Promise<PlaidAccount[]> => {
  const accountsResponse = await plaid().accountsGet({ access_token: item.access_token });
  const upstreamAccounts = accountsResponse.data.accounts;
  const now = new Date().toISOString();

  const { data: existingRows, error: fetchError } = await supabase
    .from("plaid_accounts")
    .select("id, owner, item_id, account_id, persistent_account_id, name, official_name, type, subtype, mask, status")
    .eq("owner", owner);
  if (fetchError) throw new HttpError(fetchError.code, fetchError.message);

  const { data: itemRows, error: itemsError } = await supabase
    .from("plaid_items")
    .select("id, institution_id")
    .eq("owner", owner);
  if (itemsError) throw new HttpError(itemsError.code, itemsError.message);

  const institutionByItemId = new Map((itemRows ?? []).map((row) => [row.id, row.institution_id]));
  const existing = existingRows ?? [];
  const matchedIds = new Set<string>();

  for (const upstream of upstreamAccounts) {
    const match = findExistingAccount(upstream, item.institution_id, existing, institutionByItemId);
    const row = {
      owner,
      item_id: item.id,
      account_id: upstream.account_id,
      persistent_account_id: upstream.persistent_account_id ?? null,
      name: upstream.name,
      official_name: upstream.official_name ?? null,
      type: upstream.type,
      subtype: upstream.subtype ?? null,
      mask: upstream.mask ?? null,
      status: "active",
      updated_at: now,
    };

    if (match) {
      matchedIds.add(match.id);
      const { error } = await supabase.from("plaid_accounts").update(row).eq("id", match.id);
      if (error) throw new HttpError(error.code, error.message);
    } else {
      const { data: inserted, error } = await supabase.from("plaid_accounts").insert(row).select("id").single();
      if (error) throw new HttpError(error.code, error.message);
      matchedIds.add(inserted.id);
    }
  }

  for (const row of existing.filter((account) => account.item_id === item.id)) {
    if (matchedIds.has(row.id)) continue;
    const { error } = await supabase
      .from("plaid_accounts")
      .update({ status: "disabled", updated_at: now })
      .eq("id", row.id);
    if (error) throw new HttpError(error.code, error.message);
  }

  const { data: accounts, error: accountsError } = await supabase
    .from("plaid_accounts")
    .select("id, account_id, name, official_name, type, subtype, mask, status")
    .eq("item_id", item.id)
    .eq("status", "active")
    .order("name", { ascending: true });
  if (accountsError) throw new HttpError(accountsError.code, accountsError.message);

  return (accounts ?? []).map(mapAccount);
};

export const getPlaidConnections = async (owner: string): Promise<PlaidConnections> => {
  "use cache";
  cacheTag(tags.plaid(owner));
  cacheLife("max");

  const { data: items, error: itemsError } = await supabase
    .from("plaid_items")
    .select("id, item_id, institution_id, institution_name, institution_logo, created_at")
    .eq("owner", owner)
    .order("created_at", { ascending: true });
  if (itemsError) throw new HttpError(itemsError.code, itemsError.message);

  if (!items?.length) return { connections: [], limit: MAX_PLAID_ITEMS };

  const itemIds = items.map((item) => item.id);
  const { data: accounts, error: accountsError } = await supabase
    .from("plaid_accounts")
    .select("id, item_id, account_id, name, official_name, type, subtype, mask, status")
    .eq("owner", owner)
    .eq("status", "active")
    .in("item_id", itemIds)
    .order("name", { ascending: true });
  if (accountsError) throw new HttpError(accountsError.code, accountsError.message);

  const accountsByItem = new Map<string, PlaidAccount[]>();
  for (const account of accounts ?? []) {
    if (!account.item_id) continue;
    const mapped = mapAccount(account);
    const list = accountsByItem.get(account.item_id) ?? [];
    list.push(mapped);
    accountsByItem.set(account.item_id, list);
  }

  const connections: PlaidConnection[] = items.map((item) => mapConnection(item, accountsByItem.get(item.id) ?? []));

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

export const createUpdateLinkToken = async (owner: string, connectionId: string): Promise<string> => {
  await requirePlus(owner);

  const id = z.string().uuid().parse(connectionId);
  const { data: item, error } = await supabase
    .from("plaid_items")
    .select("id, access_token")
    .eq("owner", owner)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new HttpError(error.code, error.message);
  if (!item) throw new HttpError("not_found", "Connection not found.");

  const response = await plaid().linkTokenCreate({
    user: { client_user_id: owner },
    client_name: "Zero",
    country_codes: [CountryCode.Us],
    language: "en",
    access_token: item.access_token,
    update: { account_selection_enabled: true },
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

  const itemResponse = await plaid().itemGet({ access_token: accessToken });

  const institutionId = itemResponse.data.item.institution_id;
  if (!institutionId) throw new HttpError("invalid_item", "Institution could not be determined.");

  const institution = await fetchInstitution(institutionId);

  const now = new Date().toISOString();
  const { data: item, error: itemError } = await supabase
    .from("plaid_items")
    .insert({
      owner,
      item_id: itemId,
      access_token: accessToken,
      institution_id: institutionId,
      institution_name: institution.name,
      institution_logo: institution.logo ?? null,
      updated_at: now,
    })
    .select("id, item_id, institution_id, institution_name, institution_logo, created_at, access_token")
    .single();
  if (itemError) throw new HttpError(itemError.code, itemError.message);

  const accounts = await syncPlaidAccountsForItem(owner, item);
  if (!accounts.length) throw new HttpError("no_accounts", "No accounts were found for this institution.");

  revalidateTag(tags.plaid(owner), { expire: 0 });

  return mapConnection(item, accounts);
};

export const syncPlaidItemAccounts = async (owner: string, connectionId: string): Promise<PlaidConnection> => {
  await requirePlus(owner);

  const id = z.string().uuid().parse(connectionId);
  const { data: item, error } = await supabase
    .from("plaid_items")
    .select("id, item_id, institution_id, institution_name, institution_logo, access_token, created_at")
    .eq("owner", owner)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new HttpError(error.code, error.message);
  if (!item) throw new HttpError("not_found", "Connection not found.");

  const accounts = await syncPlaidAccountsForItem(owner, item);
  revalidateTag(tags.plaid(owner), { expire: 0 });

  return mapConnection(item, accounts);
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
