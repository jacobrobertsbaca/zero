import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PageTitle } from "src/components/page-title";
import { Button } from "src/components/ui/button";
import { TransactionsPage } from "./components";

export const metadata = {
  title: "Transactions",
};

function PageFallback() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <PageTitle title="Transactions" />
        <Button type="button" variant="ghost" size="icon" disabled>
          <Loader2 className="size-4 animate-spin" />
          <span className="sr-only">Loading</span>
        </Button>
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
