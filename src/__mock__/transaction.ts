import { faker } from "@faker-js/faker";
import { random } from "lodash";
import { transactionCompare } from "src/types/transaction/methods";
import { Transaction } from "src/types/transaction/types";
import { asDateString } from "src/types/utils/methods";
import { budgets } from "./budget";
import { randomMoney } from "./money";

const generateTransaction = (): Transaction => {
  const budget = budgets[Math.floor(Math.random() * budgets.length)];
  const category = budget.categories[Math.floor(Math.random() * budget.categories.length)];

  return ({
    id: faker.string.uuid(),
    budget: budget.id,
    category: category.id,
    amount: randomMoney(10, 10000),
    date: asDateString(new Date(), random(-100, 100)),
    name: faker.word.words()
  });
};

/**
 * A random handful of {@link Transaction} objects.
 */
 export const transactions = (() => {
  const numTransactions = random(200, 300);
  const transactions = [];
  for (let i = 0; i < numTransactions; i++)
    transactions.push(generateTransaction());
  transactions.sort(transactionCompare);
  return transactions;
})();