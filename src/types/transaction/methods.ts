import { Transaction } from "./types";

export const transactionCompare = (a: Transaction, b: Transaction) => a.date.localeCompare(b.date);