export const tags = {
  budget: (budgetId: string) => `budget:${budgetId}`,
  subscription: (owner: string) => `subscription:${owner}`,
  plaid: (owner: string) => `plaid:${owner}`,
};
