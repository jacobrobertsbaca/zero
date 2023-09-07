import { Budget } from "src/types/budget/types";
import { Category } from "src/types/category/types";
import { CategoryType } from "src/types/category/types";

const CATEGORY_NAMES = {
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

// const generateCategory = (): Category => {
// };

// const generateBudget = (): Budget => {
// };