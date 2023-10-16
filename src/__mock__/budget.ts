import { faker } from "@faker-js/faker";
import { Draft, produce } from "immer";
import { Budget, BudgetStatus } from "src/types/budget/types";
import { Category, CategoryType, Recurrence, RecurrenceType, RolloverMode } from "src/types/category/types";
import { onRecurrence } from "src/types/category/methods";
import { sample, random } from "lodash";
import { randomMoney } from "./money";
import { asDateString } from "src/types/utils/methods";
import { budgetStatus } from "src/types/budget/methods";

const CATEGORY_NAMES: Record<CategoryType, string[]> = {
  [CategoryType.Income]: [
    'Section Leading',
    'Summer Job',
    'Work',
    'Bartending'
  ],
  [CategoryType.Investments]: [
    'Roth IRA',
    '401k',
    'Vanguard',
    'HSA'
  ],
  [CategoryType.Savings]: [
    'Savings',
    'House Savings',
    'Car Fund'
  ],
  [CategoryType.Spending]: [
    'Food',
    'Groceries',
    'Personal',
    'Misc',
    'Toiletries',
    'Utilities',
    'Snacks',
    'Gifts'
  ]
};

const generateRecurrence = (): Recurrence => {
  const type    = sample(RecurrenceType)!;
  switch (type) {
    case RecurrenceType.None:
      return { type, amount: randomMoney(1000, 200000) };
    case RecurrenceType.Weekly:
      return { type, day: random(6), amount: randomMoney(1000, 15000) };
    case RecurrenceType.Monthly:
      return { type, day: random(1, 31), amount: randomMoney(3000, 50000) };
  }
};

const generateCategory = (budget: Budget): Category => {
  const type = sample(Object.keys(CATEGORY_NAMES)) as CategoryType;
  const recurrence = generateRecurrence();

  let category: Category = {
    id: faker.string.uuid(),
    name: sample(CATEGORY_NAMES[type])!,
    type,
    recurrence,
    periods: [],
    rollover: {
      surplus: Math.random() > 0.5 ? RolloverMode.Average : RolloverMode.Next,
      loss: Math.random() > 0.5 ? RolloverMode.Average : RolloverMode.Next
    }
  };
  
  category = onRecurrence(budget, category, recurrence);
  category = produce(category, draft => {
    // Fill out random actual amounts
    for (const period of draft.periods) {
      period.actual = randomMoney(-1000, 1.25 * period.nominal.amount);
    }
  });
  return category;
};

const generateBudget = (): Budget => {
  const begin = asDateString(new Date(), random(-100, 100));
  const end = asDateString(begin, random(50, 200));
  const budget: Budget = {
    id: faker.string.uuid(),
    name: faker.word.words(),
    dates: { begin, end },
    categories: []
  };

  return produce(budget, draft => {
    const numCategories = random(1, 5);
    for (let i = 0; i < numCategories; i++) {
      draft.categories.push(generateCategory(draft) as Draft<Category>);
    }
  });
};

/**
 * A random handful of {@link Budget} objects.
 */
export const budgets = (() => {
  const numBudgets = random(3,8);
  const budgets = [];
  for (let i = 0; i < numBudgets; i++)
    budgets.push(generateBudget());

  // Sort budgets in this order:
  // (1) Active budgets: Soonest end date comes first
  // (2) Future budgets: Soonest start date comes first
  // (3) Past budgets: Most recent end date comes first
  budgets.sort((a, b) => {
    const aStatus = budgetStatus(a);
    const bStatus = budgetStatus(b);
    if (aStatus !== bStatus) return aStatus - bStatus;
    switch (aStatus) {
      case BudgetStatus.Active: return a.dates.end.localeCompare(b.dates.end);
      case BudgetStatus.Future: return a.dates.begin.localeCompare(b.dates.begin);
      case BudgetStatus.Past: return b.dates.end.localeCompare(a.dates.end);
    }
  });

  return budgets;
})();