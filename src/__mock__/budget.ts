import { Budget } from "src/types/budget";
import { Category } from "src/types/category";
import { CategoryType } from "src/types/category";

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
    'Vanguard'
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