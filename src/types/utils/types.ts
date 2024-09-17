import { Immutable } from "immer";

/**
 * A date in the format YYYYMMDD
 */
export type DateString = string;
export type Dates = Immutable<{ begin: DateString; end: DateString }>;

/**
 * A unique identifier for a database object.
 */
export type Id = string;
