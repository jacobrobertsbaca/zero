import { Stack, styled, Typography } from "@mui/material";
import { isEqual } from "lodash";
import { useCallback, useState } from "react";
import { DateField } from "src/components/form/date-field";
import { MoneyField } from "src/components/form/money-field";
import { SelectField } from "src/components/form/select-field";
import { TextField } from "src/components/form/text-field";
import { Scrollbar } from "src/components/scrollbar";
import { EditActions, EditState } from "src/components/sidebar/edit-actions";
import { Sidebar } from "src/components/sidebar/sidebar";
import { SidebarHeader } from "src/components/sidebar/sidebar-header";
import { Budget } from "src/types/budget/types";
import { Transaction } from "src/types/transaction/types";
import { dateFormat } from "src/types/utils/methods";
import * as Yup from "yup";
import { CategorySelector } from "./category-selector";
import { useApi } from "src/hooks/use-api";
import { closeSnackbar, enqueueSnackbar, SnackbarKey } from "notistack";
import { produce } from "immer";
import { LoadingButton, loadingButtonClasses } from "@mui/lab";
import { wrapAsync } from "src/utils/wrap-errors";

type UndoDeleteButtonProps = {
  snackbar: SnackbarKey;
  transaction: Transaction;
  update: (trx: Transaction) => Promise<void>;
};

const StyledLoadingButton = styled(LoadingButton)(({ theme }) => ({
  [`.${loadingButtonClasses.loadingIndicator}`]: {
    color: theme.palette.primary.main,
  },
}));

const UndoDeleteButton = ({ snackbar, transaction, update }: UndoDeleteButtonProps) => {
  const [loading, setLoading] = useState(false);

  return (
    <StyledLoadingButton
      loading={loading}
      onClick={async () => {
        // Must set id to empty to re-create new transaction
        setLoading(true);
        await wrapAsync(async () => {
          await update(
            produce(transaction, (draft) => {
              draft.id = "";
            })
          );
          closeSnackbar(snackbar);
          enqueueSnackbar({ message: "Restored transaction", variant: "success" });
        });
        setLoading(false);
      }}
    >
      <span>Undo</span>
    </StyledLoadingButton>
  );
};

type TransactionSidebarProps = {
  transaction: Transaction;
  budgets: readonly Budget[];
  open: boolean;
  onClose: () => void;
  onUpdate: (trx: Transaction) => void;
  onDelete: (trx: Transaction) => void;
};

export const TransactionSidebar = ({
  transaction,
  budgets,
  open,
  onClose,
  onUpdate,
  onDelete,
}: TransactionSidebarProps) => {
  const { putTransaction, deleteTransaction } = useApi();
  const isExisting = !!transaction.id;

  const budgetValues = budgets.map((b) => ({
    value: b.id,
    label: (
      <Stack>
        <Typography variant="body2">{b.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {`${dateFormat(b.dates.begin)} — ${dateFormat(b.dates.end)}`}
        </Typography>
      </Stack>
    ),
  }));

  const updateTransaction = useCallback(
    async (trx: Transaction) => {
      trx = await putTransaction(trx);
      onUpdate(trx);
    },
    [putTransaction, onUpdate]
  );

  return (
    <Sidebar
      open={open}
      onClose={onClose}
      FormProps={{
        enableReinitialize: true,
        initialValues: transaction,
        validationSchema: Yup.object({
          date: Yup.string().required("Enter a valid date!"),
          budget: Yup.string()
            .required("You must pick a budget!")
            .test("has-categories", "You must pick a budget with at least one category!", (id, ctx) => {
              const budget = budgets.find((b) => b.id === id);
              if (!budget) return true;
              return budget.categories.length > 0;
            }),
          category: Yup.string().required("You must pick a category!"),
          amount: Yup.mixed().required("You must enter an amount!"),
        }),
        onSubmit: updateTransaction,
      }}
    >
      {(form) => (
        <>
          <SidebarHeader onClose={onClose}>{isExisting ? "Edit Transaction" : "New Transaction"}</SidebarHeader>
          <Scrollbar sx={{ flexGrow: 1 }}>
            <Stack spacing={3} sx={{ p: 3 }}>
              <DateField label="Date" name="date" />
              <SelectField
                label="Budget"
                name="budget"
                values={budgetValues}
                onChange={(evt) => {
                  // Reset category to none when budget changes
                  form.setFieldValue("category", "");
                  form.setFieldValue("budget", evt.target.value);
                }}
              />
              <CategorySelector budgets={budgets} />
              <MoneyField label="Amount" name="amount" />
              <TextField label="Name" name="name" placeholder="Optional" max={120} />
              <TextField
                label="Note"
                name="note"
                placeholder="Optional"
                max={1000}
                multiline
                rows={5}
                inputProps={{ style: { resize: "vertical" } }}
              />

              <EditActions
                allowDelete={isExisting}
                dirty={!isEqual(form.values, transaction)}
                state={EditState.Edit}
                onDelete={async () => {
                  await deleteTransaction(transaction);
                  onDelete(transaction);
                  enqueueSnackbar({
                    message: "Transaction deleted",
                    autoHideDuration: 10000,
                    action: (key) => (
                      <UndoDeleteButton snackbar={key} transaction={transaction} update={updateTransaction} />
                    ),
                  });
                }}
              />
            </Stack>
          </Scrollbar>
        </>
      )}
    </Sidebar>
  );
};
