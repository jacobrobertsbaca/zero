import { Money } from "../money/types";
import { DateString } from "../utils/types";

export type Transaction = {
  /** The unique ID of this transaction. */
  id: string;

  /** The ID of the budget this transaction is associated with. */
  budget: string;

  /** The ID of the category this transaction is associated with. */
  category: string;

  /** The date of this transaction. */
  date: DateString;

  /** The amount of this transaction. */
  amount: Money;

  /** The name of this transaction. */
  name: string;

  /** UTC ISO 8601 date string for time of last modification */
  lastModified: string;

  /** Starred transactions appear at the top of the transactions list. */
  starred: boolean;

  /** An optional note associated with the transaction. */
  note: string;
};