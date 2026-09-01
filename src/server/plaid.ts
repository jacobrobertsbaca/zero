import { cacheLife, cacheTag, revalidateTag } from "next/cache";
import {
  Configuration,
  CountryCode,
  PlaidApi,
  PlaidEnvironments,
  Products,
  RemovedTransaction,
  type AccountBase,
  type Transaction as PlaidTransaction,
} from "plaid";
import { wrap, putTransaction, deleteTransaction, getTransactionsBySyncIds } from "src/server/common";
import { HttpError } from "src/server/errors";
import { getSubscription } from "src/server/billing";
import { tags } from "src/server/tags";
import { CategoryType } from "src/types/category/types";
import { defaultCurrency, moneyAbs, moneyFactor, moneyZero } from "src/types/money/methods";
import { ExchangePlaidPublicTokenSchema } from "src/types/plaid/schema";
import type { PlaidAccount, PlaidConnection, PlaidConnections, PlaidSyncItem } from "src/types/plaid/types";
import type { SyncDetails } from "src/types/transaction/types";
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
    access_token: string | null;
  },
  accounts: PlaidAccount[]
): PlaidConnection => ({
  id: item.id,
  itemId: item.item_id,
  institutionId: item.institution_id,
  institutionName: item.institution_name,
  institutionLogo: item.institution_logo,
  createdAt: item.created_at,
  inactive: item.access_token === null,
  accounts,
});

type PlaidAccountRow = {
  id: string;
  owner: string;
  item_id: string;
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

const activeConnectionCount = async (owner: string): Promise<number> => {
  const { count, error } = await supabase
    .from("plaid_items")
    .select("id", { count: "exact", head: true })
    .eq("owner", owner)
    .not("access_token", "is", null);
  if (error) throw new HttpError(error.code, error.message);
  return count ?? 0;
};

/** Soft-revoke all live Plaid Items for an owner (e.g. subscription ended). Keeps rows for reconnect dedupe. */
export const revokeAllItems = async (owner: string): Promise<void> => {
  if (!isPlaidConfigured()) return;

  const { data: items, error } = await supabase
    .from("plaid_items")
    .select("id, access_token")
    .eq("owner", owner)
    .not("access_token", "is", null);
  if (error) throw new HttpError(error.code, error.message);
  if (!items?.length) return;

  const now = new Date().toISOString();
  for (const item of items) {
    if (!item.access_token) continue;
    try {
      await plaid().itemRemove({ access_token: item.access_token });
    } catch (err) {
      console.error("Plaid itemRemove failed during revoke:", err);
    }
    const { error: updateError } = await supabase
      .from("plaid_items")
      .update({ access_token: null, updated_at: now })
      .eq("id", item.id)
      .eq("owner", owner);
    if (updateError) throw new HttpError(updateError.code, updateError.message);
  }

  revalidateTag(tags.plaid(owner), { expire: 0 });
};

export const getPlaidConnections = async (owner: string): Promise<PlaidConnections> => {
  "use cache";
  cacheTag(tags.plaid(owner));
  cacheLife("max");

  const { data: items, error: itemsError } = await supabase
    .from("plaid_items")
    .select("id, item_id, institution_id, institution_name, institution_logo, created_at, access_token")
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

  const activeCount = await activeConnectionCount(owner);
  if (activeCount >= MAX_PLAID_ITEMS) {
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
  if (!item.access_token) throw new HttpError("revoked", "This connection is inactive. Reconnect it instead.");

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

  const exchange = await plaid().itemPublicTokenExchange({ public_token: parsed.publicToken });
  const { access_token: accessToken, item_id: itemId } = exchange.data;

  const { data: existing } = await supabase.from("plaid_items").select("id").eq("item_id", itemId).maybeSingle();
  if (existing) throw new HttpError("conflict", "This institution is already connected.");

  const itemResponse = await plaid().itemGet({ access_token: accessToken });

  const institutionId = itemResponse.data.item.institution_id;
  if (!institutionId) throw new HttpError("invalid_item", "Institution could not be determined.");

  const institution = await fetchInstitution(institutionId);
  const now = new Date().toISOString();

  if (parsed.connectionId) {
    const connectionId = parsed.connectionId;
    const { data: revoked, error: revokedError } = await supabase
      .from("plaid_items")
      .select("id, institution_id, access_token")
      .eq("owner", owner)
      .eq("id", connectionId)
      .maybeSingle();
    if (revokedError) throw new HttpError(revokedError.code, revokedError.message);
    if (!revoked) throw new HttpError("not_found", "Connection not found.");
    if (revoked.access_token !== null) throw new HttpError("conflict", "That connection is still active.");
    if (revoked.institution_id !== institutionId) {
      throw new HttpError("invalid_item", "Institution does not match the selected connection.");
    }

    const { data: item, error: itemError } = await supabase
      .from("plaid_items")
      .update({
        item_id: itemId,
        access_token: accessToken,
        institution_id: institutionId,
        institution_name: institution.name,
        institution_logo: institution.logo ?? null,
        transactions_cursor: null,
        updated_at: now,
      })
      .eq("id", connectionId)
      .eq("owner", owner)
      .select("id, item_id, institution_id, institution_name, institution_logo, created_at, access_token")
      .single();
    if (itemError) throw new HttpError(itemError.code, itemError.message);

    const accounts = await syncPlaidAccountsForItem(owner, {
      id: item.id,
      access_token: accessToken,
      institution_id: item.institution_id,
    });
    if (!accounts.length) throw new HttpError("no_accounts", "No accounts were found for this institution.");

    revalidateTag(tags.plaid(owner), { expire: 0 });
    return mapConnection(item, accounts);
  }

  const activeCount = await activeConnectionCount(owner);
  if (activeCount >= MAX_PLAID_ITEMS) {
    throw new HttpError("limit_reached", `You can connect up to ${MAX_PLAID_ITEMS} institutions.`);
  }

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
  if (!item.access_token) throw new HttpError("revoked", "This connection is inactive. Reconnect it instead.");

  const accounts = await syncPlaidAccountsForItem(owner, {
    id: item.id,
    access_token: item.access_token,
    institution_id: item.institution_id,
  });
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

  if (item.access_token) {
    try {
      await plaid().itemRemove({ access_token: item.access_token });
    } catch (err) {
      console.error("Plaid itemRemove failed:", err);
    }
  }

  await wrap(supabase.from("plaid_items").delete().eq("id", id).eq("owner", owner));
  revalidateTag(tags.plaid(owner), { expire: 0 });
};

/* ================================================================================================================= *
 * Transaction sync                                                                                                  *
 * ================================================================================================================= */

/** Builds sync_details from a Plaid transaction, or null if it should not be synced (e.g. non-USD). */
const buildSyncDetails = (
  txn: PlaidTransaction,
  accountId: string,
  overrides: SyncDetails["overrides"] = {}
): SyncDetails | null => {
  if (txn.iso_currency_code !== "USD") return null;

  const originalName = txn.original_description || txn.name;
  const merchant = txn.merchant_name
    ? { name: txn.merchant_name, ...(txn.logo_url ? { logo_url: txn.logo_url } : {}) }
    : undefined;

  const counterpartyName = (txn.counterparties ?? [])
    .map((c) => c.name)
    .filter(Boolean)
    .join(" ");
  const name = (counterpartyName || merchant?.name || originalName).slice(0, 120);

  const location =
    txn.location.lat != null && txn.location.lon != null
      ? {
          lat: txn.location.lat,
          lng: txn.location.lon,
          ...(txn.location.address ? { address: txn.location.address } : {}),
          ...(txn.location.city ? { city: txn.location.city } : {}),
          ...(txn.location.region ? { region: txn.location.region } : {}),
          ...(txn.location.country ? { country: txn.location.country } : {}),
          ...(txn.location.postal_code ? { postal_code: txn.location.postal_code } : {}),
        }
      : undefined;

  const datetime = txn.authorized_datetime ?? txn.datetime ?? undefined;

  return {
    name,
    original_name: originalName,
    account_id: accountId,
    status: txn.pending ? "pending" : "posted",
    amount: {
      amount: Math.round(txn.amount * 100),
      currency: defaultCurrency,
    },
    ...(datetime ? { datetime } : {}),
    ...(merchant ? { merchant } : {}),
    ...(location ? { location } : {}),
    payment_channel: (() => {
      switch (txn.payment_channel) {
        case "online":
          return "online";
        case "in store":
          return "physical";
        default:
          return "other";
      }
    })(),
    overrides,
  };
};

const fetchPlaidUpdates = async (accessToken: string, cursor?: string | null) => {
  const added: PlaidTransaction[] = [];
  const modified: PlaidTransaction[] = [];
  const removed: RemovedTransaction[] = [];

  let nextCursor = cursor ?? undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await plaid().transactionsSync({
      access_token: accessToken,
      cursor: nextCursor,
      options: { include_original_description: true },
    });

    added.push(...response.data.added);
    modified.push(...response.data.modified);
    removed.push(...response.data.removed);
    nextCursor = response.data.next_cursor;
    hasMore = response.data.has_more;
  }

  const upserts = new Map<string, PlaidTransaction>();
  const pendingIds = new Set<string>();

  for (const txn of added) {
    if (txn.iso_currency_code !== "USD") continue;
    upserts.set(txn.pending_transaction_id ?? txn.transaction_id, txn);
    if (txn.pending_transaction_id) pendingIds.add(txn.pending_transaction_id);
  }

  for (const txn of modified) {
    if (txn.iso_currency_code !== "USD") continue;
    upserts.set(txn.pending_transaction_id ?? txn.transaction_id, txn);
  }

  return {
    upserted: [...upserts.values()],
    removed: removed.filter((txn) => pendingIds.has(txn.transaction_id)),
    cursor: nextCursor,
  };
};

const getPlaidSyncItems = async (owner: string): Promise<PlaidSyncItem[]> => {
  "use cache";
  cacheTag(tags.plaid(owner));
  cacheLife("max");

  const { data, error } = await supabase
    .from("plaid_items")
    .select("id, access_token, transactions_cursor, plaid_accounts ( id, account_id )")
    .eq("owner", owner)
    .not("access_token", "is", null);
  if (error) throw new HttpError(error.code, error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    accessToken: row.access_token,
    transactionsCursor: row.transactions_cursor,
    accounts: row.plaid_accounts.map((account) => ({ id: account.id, accountId: account.account_id })),
  }));
};

const syncTransactionsForItem = async (owner: string, item: PlaidSyncItem) => {
  const accountByPlaidId = new Map(item.accounts.map((account) => [account.accountId, account.id]));

  const { upserted, removed, cursor } = await fetchPlaidUpdates(item.accessToken, item.transactionsCursor);
  const universe = await getTransactionsBySyncIds(
    owner,
    removed
      .map((txn) => txn.transaction_id)
      .concat(upserted.map((txn) => txn.pending_transaction_id ?? txn.transaction_id))
  );

  const categoryIds = [...new Set([...universe.values()].map((t) => t.category).filter(Boolean) as string[])];
  const categoryTypes = new Map<string, CategoryType>();
  if (categoryIds.length > 0) {
    const rows = await wrap(supabase.from("categories").select("id, type").eq("owner", owner).in("id", categoryIds));
    for (const row of rows) categoryTypes.set(row.id, row.type as CategoryType);
  }

  await Promise.all([
    ...upserted.flatMap((txn) => {
      const accountId = accountByPlaidId.get(txn.account_id);
      if (!accountId) return [];

      const existing = universe.get(txn.pending_transaction_id ?? txn.transaction_id);
      const overrides = existing?.sync?.details.overrides ?? {};
      const details = buildSyncDetails(txn, accountId, overrides);
      if (!details) return;

      const amount = (() => {
        if (existing?.sync?.details.overrides.amount) return existing.amount;
        const type = existing?.category ? categoryTypes.get(existing.category) : undefined;
        if (!type) return moneyAbs(details.amount);
        if (type === CategoryType.Income) return moneyFactor(details.amount, -1);
        return details.amount;
      })();

      return putTransaction(owner, {
        id: existing?.id ?? "",
        budget: existing?.budget ?? null,
        category: existing?.category ?? null,
        date: (txn.authorized_date || txn.date).replaceAll("-", ""),
        amount,
        name: existing?.name ?? details.name,
        lastModified: existing?.lastModified ?? "",
        starred: existing?.starred ?? false,
        note: existing?.note ?? "",
        sync: {
          id: txn.transaction_id,
          pending: !existing?.budget || !existing?.category,
          details,
        },
      });
    }),
    ...removed.flatMap((txn) => {
      const existing = universe.get(txn.transaction_id);
      if (!existing) return [];

      if (existing.sync?.pending) return deleteTransaction(owner, existing.id);
      if (!existing.sync) return;

      const now = new Date().toISOString();
      return putTransaction(owner, {
        ...existing,
        amount: existing.sync.details.overrides.amount ? existing.amount : moneyZero(),
        sync: {
          ...existing.sync,
          details: {
            ...existing.sync.details,
            status: "removed",
            datetime: now,
          },
        },
      });
    }),
  ]);

  const { error } = await supabase
    .from("plaid_items")
    .update({ transactions_cursor: cursor ?? null, updated_at: new Date().toISOString() })
    .eq("id", item.id)
    .eq("owner", owner);
  if (error) throw new HttpError(error.code, error.message);
};

/**
 * Syncs Plaid transactions for all active connections belonging to {@link owner}.
 * No-ops when the user lacks an active Plus subscription or Plaid is not configured.
 */
export const syncTransactions = async (owner: string): Promise<void> => {
  if (!isPlaidConfigured()) return;

  const subscription = await getSubscription(owner);
  if (!subscription.active) return;

  const items = await getPlaidSyncItems(owner);
  if (!items.length) return;

  await Promise.all(
    items.map((item) =>
      syncTransactionsForItem(owner, item).catch((err) =>
        console.error(`Transaction sync failed for item ${item.id}:`, err)
      )
    )
  );
};
