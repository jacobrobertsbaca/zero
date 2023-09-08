import { Immutable } from "immer";
import { Category, CategoryType } from "../category/types";
import { Money } from "../money/types";
import { Dates } from "../utils/types";

export type Budget = Immutable<{
  id: string;
  name: string;
  dates: Dates;
  categories: Category[];
}>;
