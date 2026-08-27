import { Suspense } from "react";
import { PageTitle } from "src/components/page-title";
import { TransactionsPage } from "./components";

export const metadata = {
  title: "Transactions",
};

function PageFallback() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <PageTitle title="Transactions" className="text-shimmer" />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <TransactionsPage />
    </Suspense>
  );
}
