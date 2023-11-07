import { Transaction } from "./types";

export const transactionCompare = (a: Transaction, b: Transaction) => b.lastModified.localeCompare(a.lastModified);