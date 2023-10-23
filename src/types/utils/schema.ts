import * as Yup from "yup";

// Largely taken from: https://stackoverflow.com/a/6178341
// Validates that the input string is a valid date formatted as "mm/dd/yyyy"
const isValidDate = (dateString: string | undefined) => {
  if (!dateString) return true; 
  
  // First check for the pattern
  if (!/^\d{2}\d{2}\d{4}$/.test(dateString)) return false;

  // Parse the date parts to integers
  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(4, 6), 10);
  const day = parseInt(dateString.substring(6), 10);

  if (month == 0 || month > 12) return false;
  const months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Adjust for leap years
  if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
    months[1] = 29;

  // Check the range of the day
  return day > 0 && day <= months[month - 1];
};

export const dateStringSchema = () => Yup
  .string()
  .test("valid-date", "${path} is an invalid date! Format is YYYYMMDD", isValidDate)

export const datesSchema = () => Yup.object({
  begin: dateStringSchema().required(),
  end: dateStringSchema().required()
}).test(
  "is-valid", 
  "${path} cannot have an end date before its begin date",
  value => value.begin <= value.end
);