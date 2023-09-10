import { Immutable } from "immer";

/**
 * A date in the format YYYYMMDD
 */
export type DateString = string;
export type Dates = Immutable<{ begin: Date; end: Date }>;
