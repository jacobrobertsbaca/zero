import { Money } from "./money";

export enum CategoryType { 
  Income = 'income', 
  Savings = 'savings', 
  Investments = 'investments', 
  Spending = 'spending'
};

export enum TruncateMode { 
  Omit = 'omit', 
  Split = 'split', 
  Keep = 'keep' 
};

export type WeeklyRecurrence = { type: 'weekly'; day: 0|1|2|3|4|5|6 }
export type MonthlyRecurrence = { type: 'monthly'; day: number; }
export type Recurrence = WeeklyRecurrence | MonthlyRecurrence

export type CategorySummary = {
  nominal: Money;
  actual: Money;
};

export type Period = {
  begin: Date;
  end: Date;
  nominal: Money;
  actual: Money;
  truncate?: TruncateMode;
};

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  summary: CategorySummary;
  recurrence?: Recurrence;
  periods?: Period[];
};