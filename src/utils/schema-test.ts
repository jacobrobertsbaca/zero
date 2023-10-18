import { Schema } from "yup";

export const passes = <T>(schema: Schema<T>, value: T) => {
    expect(schema.isValidSync(value)).toBeTruthy();
};

export const fails = (schema: Schema, value: any) => {
    expect(schema.isValidSync(value)).toBeFalsy();
}

