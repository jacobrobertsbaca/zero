"use client";

import { isEqual } from "lodash";
import { useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { DateField } from "src/components/form/date-field";
import { FormMoneyField } from "src/components/form/money-field";
import { SelectField } from "src/components/form/select-field";
import { TextField } from "src/components/form/text-field";
import { NoteField } from "src/components/form/note-field";
import { EditActions, EditState } from "src/components/sidebar/edit-actions";
import { Sidebar } from "src/components/sidebar/sidebar";
import { Button } from "src/components/ui/button";
import { deleteTransaction, putTransaction } from "src/server/actions";
import { Budget } from "src/types/budget/types";
import { SyncStatus, Transaction } from "src/types/transaction/types";
import { dateFormat } from "src/types/utils/methods";
import * as Yup from "yup";
import { CategorySelector } from "./category-selector";
import { toast } from "sonner";
import { produce } from "immer";
import { wrapAsync } from "src/utils/wrap-errors";

type UndoDeleteButtonProps = {
  toastId: string | number;
  transaction: Transaction;
  update: (trx: Transaction) => void | Promise<void>;
};

const UndoDeleteButton = ({ toastId, transaction, update }: UndoDeleteButtonProps) => {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        void wrapAsync(async () => {
          // Must set id to empty to re-create new transaction
          await update(
            produce(transaction, (draft) => {
              draft.id = "";
            })
          );
          toast.dismiss(toastId);
          toast.success("Restored transaction");
        }).finally(() => setLoading(false));
      }}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      Undo
    </Button>
  );
};

type TransactionSidebarProps = {
  transaction: Transaction;
  budgets: readonly Budget[];
  open: boolean;
  onClose: () => void;
  onUpdate: (trx: Transaction) => void | Promise<void>;
  onDelete: (trx: Transaction) => void | Promise<void>;
};

export const TransactionSidebar = ({
  transaction,
  budgets,
  open,
  onClose,
  onUpdate,
  onDelete,
}: TransactionSidebarProps) => {
  const isExisting = !!transaction.id;
  const isPending = transaction.sync?.status === SyncStatus.Pending;

  const budgetValues = useMemo(
    () =>
      budgets.map((b) => ({
        value: b.id,
        label: (
          <div className="flex flex-col">
            <span className="text-sm">{b.name}</span>
            <span className="text-xs text-muted-foreground">
              {`${dateFormat(b.dates.begin)} — ${dateFormat(b.dates.end)}`}
            </span>
          </div>
        ),
        textValue: b.name,
      })),
    [budgets]
  );

  const handleDelete = useCallback(async () => {
    await deleteTransaction(transaction);
    await onDelete(transaction);
    const toastId = crypto.randomUUID();
    toast("Transaction deleted", {
      id: toastId,
      duration: 10000,
      action: (
        <UndoDeleteButton
          toastId={toastId}
          transaction={transaction}
          update={async (trx) => {
            const restored = await putTransaction(trx);
            await onUpdate(restored);
          }}
        />
      ),
    });
  }, [transaction, onDelete, onUpdate]);

  return (
    <Sidebar
      open={open}
      onClose={onClose}
      title={isPending ? "Confirm Transaction" : isExisting ? "Edit Transaction" : "New Transaction"}
      FormProps={{
        enableReinitialize: true,
        initialValues: transaction,
        validationSchema: Yup.object({
          date: Yup.string().required("Enter a valid date!"),
          budget: Yup.string()
            .required("You must pick a budget!")
            .test("has-categories", "You must pick a budget with at least one category!", (id) => {
              const budget = budgets.find((b) => b.id === id);
              if (!budget) return true;
              return budget.categories.length > 0;
            }),
          category: Yup.string().required("You must pick a category!"),
          amount: Yup.mixed().required("You must enter an amount!"),
        }),
        async onSubmit(values) {
          const saved = await putTransaction(values);
          await onUpdate(saved);
          onClose();
        },
      }}
    >
      {(form) => (
        <>
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
          <FormMoneyField label="Amount" name="amount" />
          <TextField label="Name" name="name" placeholder="Optional" max={120} autoComplete="off" />
          <NoteField label="Note" name="note" placeholder="Optional" />

          <EditActions
            dirty={!isEqual(form.values, transaction)}
            state={EditState.Edit}
            onDelete={isExisting ? handleDelete : undefined}
            ButtonProps={isPending ? { submit: { children: "Confirm" } } : undefined}
          />
        </>
      )}
    </Sidebar>
  );
};
