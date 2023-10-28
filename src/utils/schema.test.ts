import { enumSchema, fails, passes, valueSchema } from "./schema";

enum Empty {};

test("Empty enum schema", () => {
    const schema = enumSchema(Empty);
    fails(schema, 50);
    fails(schema, "hello");
});

enum NumericEnum { Foo = 0, Bar };

test("Numeric enum schema", () => {
    const schema = enumSchema(NumericEnum);

    // Pass using literals
    passes(schema, 0); 
    passes(schema, 1);
    
    // Pass using values
    passes(schema, NumericEnum.Foo);
    passes(schema, NumericEnum.Bar);

    fails(schema, 2);
    fails(schema, "hello");
});

enum StringEnum { Foo = "foo", Bar = "bar" };

test("Numeric enum schema", () => {
    const schema = enumSchema(StringEnum);

    // Pass using literals
    passes(schema, "foo"); 
    passes(schema, "bar");
    
    // Pass using values
    passes(schema, StringEnum.Foo);
    passes(schema, StringEnum.Bar);

    fails(schema, 2);
    fails(schema, "hello");
});

test("Literal string schema", () => {
    const schema = valueSchema("hello");
    passes(schema, "hello");
    fails(schema, "not-hello");
});

test("Literal schema for numbers", () => {
    const schema = valueSchema(5);
    passes(schema, 5);
    fails(schema, 6);
});