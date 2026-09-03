import { after } from "next/server";
import { syncTransactions } from "src/server/plaid";
import { TransactionsPage, TransactionsTitle } from "src/sections/transactions/transactions-page";
import { userId } from "src/utils/supabase/server";
import { Suspense } from "react";

async function SyncedTransactions() {
  const owner = await userId();
  after(() => syncTransactions(owner));
  return <TransactionsPage />;
}

export default async function Page() {
  return (
    <Suspense fallback={<TransactionsTitle shimmer />}>
      <SyncedTransactions />
    </Suspense>
  );
}
