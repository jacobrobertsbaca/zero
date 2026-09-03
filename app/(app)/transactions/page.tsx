import { searchTransactions } from "src/server/common";
import {
  decodeTransactionsQuery,
  toTransactionQuery,
  type NextSearchParams,
} from "src/sections/transactions/transactions-query";
import { TransactionsPage, TransactionsTitle } from "src/sections/transactions/transactions-page";
import { userId } from "src/utils/supabase/server";
import { Suspense } from "react";

async function LoadedTransactions({ searchParams }: { searchParams: Promise<NextSearchParams> }) {
  const owner = await userId();
  const model = toTransactionQuery(decodeTransactionsQuery(await searchParams, undefined));
  const page = await searchTransactions(owner, model, undefined, 25);
  return <TransactionsPage initialTransactions={[page]} />;
}

export default async function Page({ searchParams }: { searchParams: Promise<NextSearchParams> }) {
  return (
    <Suspense fallback={<TransactionsTitle shimmer />}>
      <LoadedTransactions searchParams={searchParams} />
    </Suspense>
  );
}
