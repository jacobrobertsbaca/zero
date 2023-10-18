import { fails, passes } from "src/utils/schema-test";
import { dateStringSchema, datesSchema } from "./schema";

const dateString = dateStringSchema();

test('Valid date strings pass', () => {
  passes(dateString, "20231018");
  passes(dateString, "20021121");
  passes(dateString, "20240229"); // Feb. 29, 2024 is a leap day
  passes(dateString, "20000229"); // Feb. 29, 2000 is a leap day
});

test('Invalid date strings fail', () => {
  fails(dateString, "2023"); // Too few characters
  fails(dateString, "2023201a"); // Alphabetic character
  fails(dateString, "20231000"); // Day is zero
  fails(dateString, "20230005"); // Month is zero
  fails(dateString, "20231505"); // Month greater than 12
  fails(dateString, "20231032"); // Month too big
  fails(dateString, "20231131"); // Month too big (no Nov. 31st)
  fails(dateString, "20230229"); // Not a leap year (no Feb. 29)
  fails(dateString, "21000229"); // Not a leap day (year mod 100 == 0)
});

const dates = datesSchema();

test('Valid dates pass', () => {
  passes(dates, { begin: "20231018", end: "20231018" });
});

test('Invalid dates fail', () => {
  fails(dates, { begin: "20231018" });
  fails(dates, { end: "20231018" });
  fails(dates, { });
  fails(dates, { begin: true });
});