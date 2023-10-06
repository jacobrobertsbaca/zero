import { Unstable_Grid2 as Grid, Button, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { Loading } from "src/components/loading";
import { PageTitle } from "src/components/page-title";
import { useBudget } from "src/hooks/use-api";
import { Layout as DashboardLayout } from "src/layouts/dashboard/layout";
import { dateFormat } from "src/types/utils/methods";

const Page = () => {
  const router = useRouter();
  const { result } = useBudget(router.query.id as string);

  return (
    <Loading value={result}>
      {(budget) => (
        <>
          <PageTitle title={budget.name} />
          <Typography variant="subtitle1" color="text.secondary">
              {`${dateFormat(budget.dates.begin)} — ${dateFormat(budget.dates.end)}`}
            </Typography>
        </>
      )}
    </Loading>
  );
};

Page.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
