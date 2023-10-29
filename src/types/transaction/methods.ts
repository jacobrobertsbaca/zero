import { Transaction } from "./types";

export const transactionCompare = (a: Transaction, b: Transaction) => b.date.localeCompare(a.date);