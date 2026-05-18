const Product = require("../../../models/productModel");

const buildProduct = (overrides = {}) =>
  new Product({
    title: "Laptop Asus Gaming TUF A15",
    price: 20000000,
    ...overrides,
  });

describe("Product model promotion validation", () => {
  it("fails validation when promotion price is greater than original price", () => {
    const product = buildProduct({ promotion: 21000000 });

    const validationError = product.validateSync();

    expect(validationError).toBeDefined();
    expect(validationError.errors.promotion).toBeDefined();
    expect(validationError.errors.promotion.kind).toBe("user defined");
  });

  it("passes validation when promotion price is less than original price", () => {
    const product = buildProduct({ promotion: 18000000 });

    const validationError = product.validateSync();

    expect(validationError).toBeUndefined();
  });

  it("passes validation when promotion field is missing", () => {
    const product = buildProduct();

    const validationError = product.validateSync();

    expect(validationError).toBeUndefined();
    expect(product.promotion).toBeUndefined();
  });
});