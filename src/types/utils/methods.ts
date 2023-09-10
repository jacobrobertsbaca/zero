import { produce } from "immer";
import { DateString, Dates } from "./types";
import { isString } from "lodash";

/* ================================================================================================================= *
 * Utilities                                                                                                         *
 * ================================================================================================================= */


/* ================================================================================================================= *
 * DateString                                                                                                        *
 * ================================================================================================================= */

export const isDateString = (date: unknown): date is DateString => isString(date) && date.length === 8;

/**
 * Converts a {@link Date} or {@link DateString} to a date.
 * @param date A {@link Date} or {@link DateString}. Will not be modified.
 * @param dayOffset Adds this many days to the result.
 * @returns A {@link Date}. Its hours, minutes, seconds, and milliseconds are guaranteed to be zero.
 */
export const asDate = (date: Date | DateString, dayOffset: number = 0): Date => {
  if (isDateString(date)) {
    const years = parseInt(date.substring(0, 4), 10);
    const months = parseInt(date.substring(4, 6), 10) - 1;
    const days = parseInt(date.substring(6, 8), 10) + dayOffset;
    return new Date(years, months, days);
  }

  date = new Date(date);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date;
};

/**
 * Converts a {@link Date} or {@link DateString} to a {@link DateString}.
 * @param date A {@link Date} or {@link DateString}. Will not be modified.
 * @param dayOffset Adds this many days to the result.
 * @returns A {@link DateString}
 */
export const asDateString = (date: Date | DateString, dayOffset: number = 0): DateString => {
  date = asDate(date, dayOffset);
  const years = `${date.getFullYear()}`.padStart(4, '0');
  const months = `${date.getMonth() + 1}`.padStart(2, '0');
  const days = `${date.getDay()}`.padStart(2, '0');
  return `${years}${months}${days}`;
};

/* ================================================================================================================= *
 * Date Ranges                                                                                                       *
 * ================================================================================================================= */


export const fixDate = (date: Date, dayOffset: number = 0): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + dayOffset);
  return result;
};

export const fixDates = (dates: Dates): Dates => {
  return { begin: fixDate(dates.begin), end: fixDate(dates.end) };
};

export const datesContains = (a: Dates, b: Dates | Date): boolean => {
  if (b instanceof Date) return datesContains(a, { begin: b, end: b });
  const begin = fixDate(a.begin);
  const end = fixDate(a.end, 1);
  return b.begin >= begin && b.begin < end && b.end >= begin && b.end < end;
};

export const datesDays = (dates: Dates): number => {
  dates = fixDates(dates);
  const oneDay = 1000 * 60 * 60 * 24;
  // +1 because date ranges are inclusive
  return 1 + Math.round((dates.end.valueOf() - dates.begin.valueOf()) / oneDay);
};

/** Clamps {@link clamp} to fall within {@link dates}. */
export const datesClamp = (clamp: Dates, dates: Dates): Dates => {
  clamp = fixDates(clamp);
  dates = fixDates(dates);
  return produce(clamp, (draft) => {
    if (draft.begin < dates.begin) draft.begin = dates.begin;
    if (draft.end > dates.end) draft.end = dates.end;
  });
};
