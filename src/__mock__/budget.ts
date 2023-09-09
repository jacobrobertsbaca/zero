import { faker } from "@faker-js/faker";
import { Draft, produce } from "immer";
import { Budget } from "src/types/budget/types";
import { Category, CategoryType, Recurrence, RecurrenceType } from "src/types/category/types";
import { onCategoryNominal, onRecurrence } from "src/types/category/methods";
import { sample, random } from "lodash";
import { randomMoney } from "./money";
import { fixDate } from "src/types/utils/methods";

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
  const amount  = randomMoney(1000, 200000);
  switch (type) {
    case RecurrenceType.None:
      return { type, amount: randomMoney(1000, 200000) };
    case RecurrenceType.Weekly:
      return { type, day: random(6), amount: randomMoney(1000, 15000) };
    case RecurrenceType.Monthly:
      return { type, day: random(), amount: randomMoney(3000, 50000) };
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
    periods: []
  };
  
  category = onRecurrence(budget, category, recurrence, true);
  return category;
};

export const generateBudget = (): Budget => {
  const begin = fixDate(new Date(), random(-100, 100));
  const end = fixDate(begin, random(50, 200));
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