import { produce } from "immer";
import { Dates } from "./types";

const toDate = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const datesContains = (a: Dates, b: Dates | Date): boolean => {
  if (b instanceof Date) return datesContains(a, { begin: b, end: b });
  const begin = toDate(a.begin);
  const end = toDate(a.end);
  end.setDate(end.getDate() + 1);
  return b.begin >= begin && b.begin < end && b.end >= begin && b.end < end;
};

export const datesDays = (dates: Dates): number => {
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.round((dates.end.valueOf() - dates.begin.valueOf()) / oneDay);
};

/** Clamps {@link clamp} to fall within {@link dates}. */
export const datesClamp = (clamp: Dates, dates: Dates): Dates => {
  return produce(clamp, (draft) => {
    if (draft.begin < dates.begin) draft.begin = dates.begin;
    if (draft.end > dates.end) draft.end = dates.end;
  });
};
