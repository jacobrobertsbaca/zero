import { produce } from "immer";
import { Dates } from "./types";

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
  return Math.round((dates.end.valueOf() - dates.begin.valueOf()) / oneDay);
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
