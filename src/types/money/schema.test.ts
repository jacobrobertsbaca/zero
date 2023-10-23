import { fails, passes } from "src/utils/schema";
import { moneySchema } from "./schema";

const schema = moneySchema();

test('Valid money passes', () => {
  passes(schema, { amount: 0, currency: "USD" });
  passes(schema, { amount: -40, currency: "USD" });
});

test('Invalid money fails', () => {
  fails(schema, { amount: 0 }); // Amount but not currency
  fails(schema, { currency: "USD" }); // Currency but no amount
  fails(schema, { amount: "abc", currency: "USD" }); // Amount wrong type
  fails(schema, { amount: 0, currency: "ABC" }); // Non-existent currency
  fails(schema, {}); // Empty money
});