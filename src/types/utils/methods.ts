import { Dates } from "./types"

export const datesContains = (a: Dates, b: Dates | Date): boolean => {
  const begin = a.begin;
  const end   = new Date(a.end); 
  a.end.setDate(a.end.getDate() + 1);

  if (b instanceof Date) return b >= begin && b < end;
  return datesContains(a, b.begin) && datesContains(a, b.end);
}