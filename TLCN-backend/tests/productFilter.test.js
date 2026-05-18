process.env.GOOGLE_CLIENT_ID = "test";
process.env.GOOGLE_CLIENT_SECRET = "test";
process.env.GOOGLE_CALLBACK_URL = "test";

const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = require("../app");
const Product = require("../models/productModel");
const Brand = require("../models/brandModel");
const Category = require("../models/categoryModel");

let mongoServer;
let appleBrand;
let dellBrand;
let laptopCategory;

const getProducts = (response) => response.body.data?.data || response.body.data || [];
const productTitles = (response) => getProducts(response).map((product) => product.title);

beforeAll(async () => {
  process.env.GEMINI_API_KEY = "";
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await Promise.all([
    Product.deleteMany(),
    Brand.deleteMany(),
    Category.deleteMany(),
  ]);

  [appleBrand, dellBrand] = await Brand.create([
    { name: "Apple" },
    { name: "Dell" },
  ]);

  laptopCategory = await Category.create({ name: "Laptop" });

  await Product.insertMany([
    {
      title: "Apple MacBook Air M2 16GB Silver",
      price: 1200,
      promotion: 1100,
      specs: { color: "Silver", ram: "16GB", cpu: "Apple M2" },
      brand: appleBrand._id,
      category: laptopCategory._id,
      inventory: 10,
    },
    {
      title: "Dell XPS 13 8GB Black",
      price: 950,
      promotion: 900,
      specs: { color: "Black", ram: "8GB", cpu: "Intel i5" },
      brand: dellBrand._id,
      category: laptopCategory._id,
      inventory: 7,
    },
    {
      title: "Dell Precision 5570 32GB Silver",
      price: 2200,
      promotion: 2100,
      specs: { color: "Silver", ram: "32GB", cpu: "Intel i7" },
      brand: dellBrand._id,
      category: laptopCategory._id,
      inventory: 4,
    },
    {
      title: "Apple MacBook Pro M3 16GB Space Gray",
      price: 1800,
      promotion: 1700,
      specs: { color: "Space Gray", ram: "16GB", cpu: "Apple M3" },
      brand: appleBrand._id,
      category: laptopCategory._id,
      inventory: 5,
    },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("GET /api/v1/products filtering", () => {
  it("filters products by brand", async () => {
    const response = await request(app)
      .get("/api/v1/products")
      .query({ brand: appleBrand._id.toString() })
      .expect(200);

    expect(productTitles(response)).toEqual(
      expect.arrayContaining([
        "Apple MacBook Air M2 16GB Silver",
        "Apple MacBook Pro M3 16GB Space Gray",
      ])
    );
    expect(productTitles(response)).not.toContain("Dell XPS 13 8GB Black");
    expect(productTitles(response)).not.toContain("Dell Precision 5570 32GB Silver");
  });

  it("filters products by color", async () => {
    const response = await request(app)
      .get("/api/v1/products")
      .query({ "specs.color": "Silver" })
      .expect(200);

    expect(productTitles(response)).toEqual(
      expect.arrayContaining([
        "Apple MacBook Air M2 16GB Silver",
        "Dell Precision 5570 32GB Silver",
      ])
    );
    expect(productTitles(response)).not.toContain("Dell XPS 13 8GB Black");
    expect(productTitles(response)).not.toContain("Apple MacBook Pro M3 16GB Space Gray");
  });

  it("filters products by RAM", async () => {
    const response = await request(app)
      .get("/api/v1/products")
      .query({ "specs.ram": "16GB" })
      .expect(200);

    expect(productTitles(response)).toEqual(
      expect.arrayContaining([
        "Apple MacBook Air M2 16GB Silver",
        "Apple MacBook Pro M3 16GB Space Gray",
      ])
    );
    expect(productTitles(response)).not.toContain("Dell XPS 13 8GB Black");
    expect(productTitles(response)).not.toContain("Dell Precision 5570 32GB Silver");
  });

  it("filters products by price range", async () => {
    const response = await request(app)
      .get("/api/v1/products")
      .query({ price: { gte: 1000, lte: 2000 } })
      .expect(200);

    expect(productTitles(response)).toEqual(
      expect.arrayContaining([
        "Apple MacBook Air M2 16GB Silver",
        "Apple MacBook Pro M3 16GB Space Gray",
      ])
    );
    expect(productTitles(response)).not.toContain("Dell XPS 13 8GB Black");
    expect(productTitles(response)).not.toContain("Dell Precision 5570 32GB Silver");
  });
});

describe("GET /api/v1/products sorting", () => {
  it("sorts products by ascending price", async () => {
    const response = await request(app)
      .get("/api/v1/products")
      .query({ sort: "price" })
      .expect(200);

    expect(productTitles(response)).toEqual([
      "Dell XPS 13 8GB Black",
      "Apple MacBook Air M2 16GB Silver",
      "Apple MacBook Pro M3 16GB Space Gray",
      "Dell Precision 5570 32GB Silver",
    ]);
  });

  it("sorts products by descending price", async () => {
    const response = await request(app)
      .get("/api/v1/products")
      .query({ sort: "-price" })
      .expect(200);

    expect(productTitles(response)).toEqual([
      "Dell Precision 5570 32GB Silver",
      "Apple MacBook Pro M3 16GB Space Gray",
      "Apple MacBook Air M2 16GB Silver",
      "Dell XPS 13 8GB Black",
    ]);
  });
});
