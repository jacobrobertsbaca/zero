import z from "zod";
import { Money } from "../money/types";
import { DateString } from "../utils/types";
import {
  BaseTransactionFilterSchema,
  TransactionSearchColumnSchema,
  TransactionQuerySchema,
  TransactionSortSchema,
} from "./schema";
import { Immutable } from "immer";

export type SyncDetails = Immutable<{
  /** The generated default name of this transaction. */
  name: string;

  /** The Plaid `original_description` of this transaction. */
  original_name: string;

  /** The app ID (`plaid_accounts.id`) of the account associated with this transaction. */
  account_id: string;

  /** The status of the transaction. */
  status: "posted" | "pending" | "removed";

  /**
   * The external amount of this transaction (USD only).
   * Sign always matches Plaid's convention (positive for money leaving the account).
   */
  amount: Money;
  datetime?: string;

  merchant?: {
    name: string;
    logo_url?: string;
  };

  location?: {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    region?: string;
    country?: string;
    postal_code?: string;
  };

  payment_channel: "online" | "physical" | "other";

  /**
   * Whether the user has overridden fields inferred from the synced transaction.
   * `undefined` means the field has not been overridden.
   */
  overrides: {
    name?: true;
    amount?: true;
  };
}>;

export enum SyncStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Removed = "removed",
}

export type TransactionSync = Immutable<{
  id: string;
  status: SyncStatus;
  details: SyncDetails;
}>;

export type Transaction = Immutable<{
  /** The unique ID of this transaction. */
  id: string;

  /** The ID of the budget this transaction is associated with. */
  budget: string | null;

  /** The ID of the category this transaction is associated with. */
  category: string | null;

  /** The date of this transaction. */
  date: DateString;

  /** The amount of this transaction. */
  amount: Money;

  /** The name of this transaction. */
  name: string;

  /** UTC ISO 8601 date string for time of last modification */
  lastModified: string;

  /** Starred transactions appear at the top of the transactions list. */
  starred: boolean;

  /** An optional note associated with the transaction. */
  note: string;

  /** Sync metadata, present when this row originated from an external sync. */
  sync?: TransactionSync;
}>;

export type TransactionCursor = Immutable<
  Transaction & {
    /** The name of the budget this transaction is associated with. */
    budgetName: string | null;

    /** The name of the category this transaction is associated with. */
    categoryName: string | null;
  }
>;

export type TransactionPage = Immutable<{
  transactions: Transaction[];
  /** The cursor to get the next page of results, or `undefined` if none remaining. */
  cursor: TransactionCursor | undefined;
  meta: {
    /** The total number of rows for the given query model. Only computed on first request. */
    count?: number;
  };
}>;

export type TransactionFilter =
  | z.infer<typeof BaseTransactionFilterSchema>
  | {
      type: "or" | "and";
      filters: TransactionFilter[];
    };

export type TransactionSort = z.infer<typeof TransactionSortSchema>;
export type TransactionSearchColumn = z.infer<typeof TransactionSearchColumnSchema>;
export type TransactionQuery = z.infer<typeof TransactionQuerySchema>;
