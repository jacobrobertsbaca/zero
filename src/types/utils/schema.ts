import { z } from "zod";

const isValidDate = (dateString: string) => {
  // First check for the pattern
  if (!/^\d{2}\d{2}\d{4}$/.test(dateString)) return false;

  // Parse the date parts to integers
  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(4, 6), 10);
  const day = parseInt(dateString.substring(6), 10);

  if (month == 0 || month > 12) return false;
  const months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Adjust for leap years
  if (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)) months[1] = 29;

  // Check the range of the day
  return day > 0 && day <= months[month - 1];
};

export const DateStringSchema = z.string().refine(isValidDate, "Invalid date string! Must have format YYYYMMDD");

export const DatesSchema = z
  .object({
    begin: DateStringSchema,
    end: DateStringSchema,
  })
  .refine((value) => {
    return value.begin <= value.end;
  }, "Dates cannot end before it begins!");
