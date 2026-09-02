import type { Immutable } from "immer";

export type PlaidItemStatus = "active" | "inactive" | "login-required";

export type PlaidAccount = Immutable<{
  id: string;
  accountId: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  status: string;
}>;

export type PlaidConnection = Immutable<{
  id: string;
  itemId: string;
  institutionId: string;
  institutionName: string;
  institutionLogo: string | null;
  accounts: PlaidAccount[];
  createdAt: string;
  status: PlaidItemStatus;
}>;

export type PlaidSyncAccount = Immutable<{
  id: string;
  accountId: string;
}>;

export type PlaidSyncItem = Immutable<{
  id: string;
  accessToken: string;
  transactionsCursor: string | null;
  accounts: PlaidSyncAccount[];
}>;

export type PlaidConnections = Immutable<{
  connections: PlaidConnection[];
  limit: number;
}>;
