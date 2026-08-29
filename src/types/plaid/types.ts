import type { Immutable } from "immer";

export type PlaidAccount = Immutable<{
  id: string;
  accountId: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
}>;

export type PlaidConnection = Immutable<{
  id: string;
  itemId: string;
  institutionId: string;
  institutionName: string;
  status: string;
  accounts: PlaidAccount[];
  createdAt: string;
}>;

export type PlaidConnections = Immutable<{
  connections: PlaidConnection[];
  limit: number;
}>;
