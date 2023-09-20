import { categoryActual, categoryNominal } from "../category/methods";
import { moneySum } from "../money/methods";
import { Money } from "../money/types";
import { Budget } from "./types";

/**
 * Computes and returns the total nominal amount of a budget.
 */
export const budgetNominal = (budget: Budget): Money => {
  return moneySum(...budget.categories.map(categoryNominal));
};

/**
 * Computes and returns the total actual amount of a budget.
 */
export const budgetActual = (budget: Budget): Money => {
  return moneySum(...budget.categories.map(categoryActual));
};