import { Suspense } from "react";
import { getPlaidConnections, syncTransactions } from "src/server/actions";
import { TransactionsPage, TransactionsTitle } from "src/sections/transactions/transactions-page";

export default function Page() {
  return (
    <Suspense fallback={<TransactionsTitle shimmer />}>
      <TransactionsData />
    </Suspense>
  );
}

async function TransactionsData() {
  const [plaid, didSync] = await Promise.all([getPlaidConnections(), syncTransactions()]);
  return <TransactionsPage plaid={plaid} didSync={didSync} />;
}
