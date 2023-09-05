import { Money } from "./money";

export enum CategoryType { 
  Income = 'income', 
  Savings = 'savings', 
  Investments = 'investments', 
  Spending = 'spending'
};

export enum TruncateMode { Omit, Split, Keep };

export type Period = {
  begin: Date;
  end: Date;
  nominal: Money;
  actual?: Money;
  truncate?: TruncateMode;
};

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  amount: Money;
  periods?: Period[];
};