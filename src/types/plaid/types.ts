import type { Immutable } from "immer";

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
  inactive: boolean;
}>;

export type PlaidConnections = Immutable<{
  connections: PlaidConnection[];
  limit: number;
}>;
