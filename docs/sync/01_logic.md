Now I want to start working on syncing transactions from plaid. Architecturally, this change will not introduce any new tables, but rather keep all data for synced transactions in the same "transactions" table that already exists.

## Database Structure

In terms of database changes, I want to introduce a couple new columns to the transactions table:

- `sync_id` (`text`). Defaults to null. This contains the remote transaction ID from Plaid of the transaction that originated this entry in the database. This will be used for reconciliation when transaction details change, transactions post, etc.
- `sync_pending` (`boolean`). Whether this transaction has been confirmed by the user. It should be a derived column and `true` iff either of `transactions.budget` or `transactions.category` is `null`.
- `sync_details` (`jsonb`). Defaults to null. A JSON structure that contains info about the transaction received externally from Plaid. The structure of this object will look like this:

```ts
type SyncDetails = {
  // The Plaid `original_description` of this transaction
  name: string;

  // The app ID (i.e. `plaid_accounts.id`) of the account associated with this transaction (must be mapped).
  account_id: string;

  // The status of the transaction
  status: "posted" | "pending" | "removed";

  // The external amount of this transaction. For now, we will only sync USD transactions.
  // The sign of this amount will always match Plaid's convention (positive for money leaving the account, negative for money entering), regardless of
  // how this transaction is categorized.
  amount: Money;

  // ISO-8601 format of the transaction's date.
  // Use Plaid's `authorized_datetime` when available, otherwise `datetime` if available, or otherwise `undefined` if neither is available.
  // If `status` is `removed`, this is the datetime that the transaction was removed.
  datetime?: string;

  // The merchant's logo URL, if available
  logo_url?: string;

  // The location where this transaction occurred. Only include if both `lat` and `lng` were available in Plaid's transaction. For all other fields, copy the remaining fields from Plaid, using `undefined` when a field is unavailable
  location?: {
    lat: double;
    lng: double;
    address?: string;
    city?: string;
    region?: string;
    country?: string;
    postal_code?: string;
  };

  // `in store` maps to `physical`, `online` maps to itself, all other values are `other`
  payment_channel: "online" | "physical" | "other";

  // By default, these fields are inferred from the externally synced transaction details.
  // This object determines whether the user has chosen to override the corresponding fields.
  overrides: {
    // Has the user provided a custom name for this transaction?
    // When a transaction posts, the `transactions.name` column should *not* be updated if this value is `false`.
    // Defaults `undefined`
    name?: true;
    // Has the user provided a custom amount for this transaction?
    // When a transaction posts, the `transactions.amount` column *should* be updated if this value is `false`.
    // Defaults `undefined`
    amount?: true;
  };
};
```

We will also need to modify the `budgets` and `categories` columns. Newly imported transactions will not have an assigned budget/category yet, and so these columns should be made nullable.

## Syncing Behaviour

Syncing should be done when the transactions page is loaded. Syncing should be done server side, but should not delay the rendering of the transactions page. [`after()`](https://nextjs.org/docs/app/api-reference/functions/after) may be a good tool for this.

Newly synced transactions behave as follows:

- The new transaction will have a `budget` and `category` set to `null`.
- It's `sync_id` will be set to the ID of the incoming `plaid` transaction.
- It's `sync_details` should be populated according to the documentation above.
- It's `transactions.name` should be assigned to either 1) the space concatenation of `plaid.counterparties[i].name`, if non-empty, 2) `plaid.merchant_name` if available, or 3) `details.name`.
- It's `transactions.date` should be assigned to `plaid.authorized_date` or `plaid.date`, whichever is available.
- It's `transactions.amount` should be assigned to the absolute value of `details.amount`.

When a transaction posts and replaces an existing transaction:

- Update `details.amount` with the new amount.
- `transactions.amount` should be updated, but only if `details.overrides.amount` is not true. In this case, if the transaction being updated has not been assigned a category, we can assign it the absolute value of `details.amount` as usual. If it has been assigned a category, then update with the negated value of the upstream amount (if the category type is Income), or the signed amount received upstream (if the category type is not Income).
- `details.name` should be updated with `plaid.original_description`.

If a transaction is removed:

- If the transaction is still `sync_pending`, then simply delete the corresponding row.
- Otherwise, mark `details.status` as `removed` and update `details.datetime` and `details.amount`. If `details.overrides.amount` is not `true`, zero out `transactions.amount`.

## User Interface

Synced transactions should show up before all other transactions, including starred ones, in the table. Effectively, this means sorting descending by `sync_pending` in the default transactions sort. These rows should have a filled green sprout icon in place of the usual star and have a light colored background.

Beyond this, do not apply any other changes to the transactions UI. We can return to this once the syncing logic has been put in place, but this should give us a nice way to test the syncing logic.

## Development

Write code simply and straightforwardly, and avoid making large changes. Consider whether you are choosing the simplest approach when implementing the above specification. Prefer adding logic onto existing files rather than adding new ones.
