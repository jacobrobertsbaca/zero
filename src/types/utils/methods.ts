import { produce } from "immer";
import { DateString, Dates } from "./types";
import { isString } from "lodash";

/* ================================================================================================================= *
 * DateString                                                                                                        *
 * ================================================================================================================= */

export const isDateString = (date: unknown): date is DateString => isString(date) && date.length === 8;

/**
 * Converts a {@link Date} or {@link DateString} to a date.
 * @param date A {@link Date} or {@link DateString}. Will not be modified.
 * @param dayOffset Adds this many days to the result. Defaults to 0.
 * @returns A {@link Date}. Its hours, minutes, seconds, and milliseconds are guaranteed to be zero.
 */
export const asDate = (date: Date | DateString, dayOffset: number = 0): Date => {
  if (isDateString(date)) {
    const years = parseInt(date.substring(0, 4), 10);
    const months = parseInt(date.substring(4, 6), 10) - 1;
    const days = parseInt(date.substring(6, 8), 10) + dayOffset;
    const result = new Date();
    result.setFullYear(years, months, days);
    return result;
  }

  date = new Date(date);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date;
};

/**
 * Converts a {@link Date} or {@link DateString} to a {@link DateString}.
 * @param date A {@link Date} or {@link DateString}. Will not be modified.
 * @param dayOffset Adds this many days to the result. Defaults to 0.
 * @returns A {@link DateString}
 */
export const asDateString = (date: Date | DateString, dayOffset: number = 0): DateString => {
  date = asDate(date, dayOffset);
  const years = `${date.getFullYear()}`.padStart(4, '0');
  const months = `${date.getMonth() + 1}`.padStart(2, '0');
  const days = `${date.getDate()}`.padStart(2, '0');
  return `${years}${months}${days}`;
};

type DateFormatOptions = {
  excludeYear?: boolean
};

/**
 * Formats a date to look like "MON DAY YEAR".
 * E.g. "Nov 21 2002".
 */
export const dateFormat = (date: Date | DateString, options?: DateFormatOptions): string => {
  date = asDate(date);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ] as const;

  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}` + (!options?.excludeYear ? ` ${year}` : '');
};

export const dateMin = (): DateString => "00000101";
export const dateMax = (): DateString => "99991231";

/* ================================================================================================================= *
 * Date Ranges                                                                                                       *
 * ================================================================================================================= */

export const asDates = (dates: Dates): [Date, Date] => [
  asDate(dates.begin),
  asDate(dates.end)
];

export const datesContains = (a: Dates, b: Dates | DateString | Date): boolean => {
  const [begin, end] = asDates(a);
  if (isDateString(b) || b instanceof Date) {
    const date = asDate(b);
    return date >= begin && date <= end;
  }

  const [dateBegin, dateEnd] = asDates(b);
  return dateBegin >= begin && dateEnd <= end;
};

export const datesDays = (dates: Dates): number => {
  const [begin, end] = asDates(dates);
  const oneDay = 1000 * 60 * 60 * 24;
  // +1 because date ranges are inclusive
  return 1 + Math.round((end.valueOf() - begin.valueOf()) / oneDay);
};

/** Clamps {@link clamp} to fall within {@link dates}. */
export const datesClamp = (clamp: Dates, dates: Dates): Dates => {
  const [clampBegin, clampEnd] = asDates(clamp);
  const [datesBegin, datesEnd] = asDates(dates);
  return produce(clamp, (draft) => {
    if (clampBegin < datesBegin) draft.begin = dates.begin;
    if (clampEnd > datesEnd) draft.end = dates.end;
  });
};
