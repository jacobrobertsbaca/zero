import { after } from "next/server";
import { searchTransactions } from "src/server/common";
import { syncTransactions } from "src/server/plaid";
import {
  decodeTransactionsQuery,
  toTransactionQuery,
  type NextSearchParams,
} from "src/sections/transactions/transactions-query";
import { TransactionsPage, TransactionsTitle } from "src/sections/transactions/transactions-page";
import { userId } from "src/utils/supabase/server";
import { Suspense } from "react";

async function SyncedTransactions({ searchParams }: { searchParams: Promise<NextSearchParams> }) {
  const owner = await userId();
  after(() => syncTransactions(owner));
  const model = toTransactionQuery(decodeTransactionsQuery(await searchParams, undefined));
  const page = await searchTransactions(owner, model, undefined, 25);
  return <TransactionsPage initialTransactions={[page]} />;
}

export default async function Page({ searchParams }: { searchParams: Promise<NextSearchParams> }) {
  return (
    <Suspense fallback={<TransactionsTitle shimmer />}>
      <SyncedTransactions searchParams={searchParams} />
    </Suspense>
  );
}
