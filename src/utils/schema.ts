import { error } from "console";
import { isObject, isObjectLike, omit, transform } from "lodash";
import * as Yup from "yup";

/* ================================================================================================================= *
 * Testing Utilities                                                                                                 *
 * ================================================================================================================= */

type Schema = {
  validateSync(value: any, options?: Yup.ValidateOptions): any
}

const getErrors = (schema: Schema, value: any) => {
  try {
    schema.validateSync(value, { abortEarly: true });
  } catch (err) {
    if (err instanceof Yup.ValidationError) return err.errors;
    throw err;
  }
  return undefined;
};

export const passes = (schema: Schema, value: any) => {
  expect(getErrors(schema, value)).toBeUndefined();
};

export const fails = (schema: Schema, value: any) => {
  expect(getErrors(schema, value)).toBeDefined();
}

/* ================================================================================================================= *
 * Schema Generators                                                                                                 *
 * ================================================================================================================= */

type Enum<T extends {}> = {
  [s: string]: T;
};

export const enumSchema = <T extends {}>(e: Enum<T>) => Yup.mixed<T>().oneOf(Object.values(e));

export const valueSchema = <T extends {}>(t: T) => Yup.mixed<T>().oneOf([t]);