import { Suspense } from "react";
import { getPlaidConnections } from "src/server/actions";
import { TransactionsPage, TransactionsTitle } from "src/sections/transactions/transactions-page";

export default function Page() {
  return (
    <Suspense fallback={<TransactionsTitle shimmer />}>
      <TransactionsData />
    </Suspense>
  );
}

async function TransactionsData() {
  const plaid = await getPlaidConnections();
  return <TransactionsPage plaid={plaid} />;
}
