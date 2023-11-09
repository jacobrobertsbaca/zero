import { Transaction } from "./types";

const dateCompare = (a: Transaction, b: Transaction) => {
  return b.date.localeCompare(a.date) || b.lastModified.localeCompare(a.lastModified);
};

export const transactionCompare = (a: Transaction, b: Transaction) => {
  if (a.starred && b.starred) return dateCompare(a, b);
  if (a.starred) return -1.0;
  if (b.starred) return 1.0;
  return dateCompare(a, b);
}