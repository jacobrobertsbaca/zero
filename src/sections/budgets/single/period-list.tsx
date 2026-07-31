import { Category, Period, RecurrenceType } from "src/types/category/types";
import { SpendingBar } from "../common/spending-bar";
import { categoryActiveIndex, categoryRollover, periodDatesFormat } from "src/types/category/methods";
import { MoneyText } from "src/components/money-text";
import { moneySum, RoundingMode } from "src/types/money/methods";
import { PaginatedTable } from "src/components/table/paginated-table";
import { PaginatedRows } from "src/components/table/paginated-rows";
import { PaginatedOptions } from "src/components/table/paginated-options";
import { TransactionsLink } from "src/sections/transactions/transactions-link";

type PeriodListProps = {
  category: Category;
};

export const PeriodList = ({ category }: PeriodListProps) => {
  const includeEarlier = category.periods[0].actual.amount !== 0;
  const includeLater = category.periods[category.periods.length - 1].actual.amount !== 0;

  /* Hide period list if recurrence is none and no earlier/later periods */
  if (category.recurrence.type === RecurrenceType.None && !includeEarlier && !includeLater) return null;

  const activeIndex = categoryActiveIndex(category) - (includeEarlier ? 0 : 1);
  const rollovers = categoryRollover(category).filter((p, i) => {
    if (i === 0) return includeEarlier;
    if (i === category.periods.length - 1) return includeLater;
    return true;
  });

  const rows = category.periods.filter((p, i) => {
    if (i === 0) return includeEarlier;
    if (i === category.periods.length - 1) return includeLater;
    return true;
  });

  const isCurrent = (index: number) => {
    if (includeEarlier && index === 0) return false;
    if (includeLater && index === rows.length - 1) return false;
    return index === activeIndex;
  };

  let defaultPage = activeIndex < rows.length ? Math.floor(activeIndex / 10) : 0;
  if (includeLater && activeIndex === rows.length - 1) defaultPage = 0;

  return (
    <PaginatedTable rows={rows} rowsPerPageOptions={[10]} defaultPage={defaultPage}>
      <thead>
        <tr className="border-b text-left text-xs text-muted-foreground">
          <th className="px-2 py-2 font-medium">Period</th>
          <th className="w-2/5 px-2 py-2 font-medium">Progress</th>
        </tr>
      </thead>
      <tbody>
        <PaginatedRows>
          {(period: Period, index: number) => (
            <tr key={`${period.dates.begin}${period.dates.end}`} className="border-b last:border-b-0 hover:bg-muted/40">
              <td className="px-2 py-2.5 align-top">
                <div className="flex items-center gap-1.5">
                  <TransactionsLink category={category} period={period} />
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {index === 0 && includeEarlier
                        ? "Earlier"
                        : index === rows.length - 1 && includeLater
                        ? "Later"
                        : periodDatesFormat(period)}
                    </span>
                    {isCurrent(index) && <span className="text-xs text-muted-foreground">Current</span>}
                  </div>
                </div>
              </td>
              <td className="px-2 py-2.5 align-top">
                <SpendingBar
                  actual={period.actual}
                  nominal={moneySum(period.nominal, rollovers[index])}
                  remaining={
                    rollovers[index].amount !== 0 && (
                      <MoneyText
                        className="text-xs font-bold"
                        amount={rollovers[index]}
                        plus
                        status
                        round={RoundingMode.RoundZero}
                      />
                    )
                  }
                />
              </td>
            </tr>
          )}
        </PaginatedRows>
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={2}>
            <PaginatedOptions />
          </td>
        </tr>
      </tfoot>
    </PaginatedTable>
  );
};
