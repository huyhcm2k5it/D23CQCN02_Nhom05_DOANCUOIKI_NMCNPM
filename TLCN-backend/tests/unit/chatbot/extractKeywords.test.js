const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadExtractKeywords() {
  const controllerPath = path.join(
    __dirname,
    "../../../controllers/chatController.js"
  );

  const source = fs.readFileSync(controllerPath, "utf8");

  const start = source.indexOf("function extractKeywords");
  const end = source.indexOf("async function retrieveProducts", start);

  if (start === -1 || end === -1) {
    throw new Error("extractKeywords function not found in chatController.js");
  }

  const sandbox = {};

  vm.createContext(sandbox);

  vm.runInContext(
    `${source.slice(start, end)}; this.extractKeywords = extractKeywords;`,
    sandbox
  );

  return sandbox.extractKeywords;
}

const extractKeywords = loadExtractKeywords();

const hasKeyword = (keywords, expected) =>
  keywords.includes(expected);

const findByType = (keywords, type) =>
  keywords.find((item) => item.type === type);

describe("extractKeywords", () => {

  it("extracts brand, gaming demand, and upper price from an Asus gaming query", () => {

    const keywords = extractKeywords(
      "Tư vấn laptop gaming Asus dưới 20 triệu"
    );

    expect(hasKeyword(keywords, "asus")).toBe(true);

    expect(hasKeyword(keywords, "gaming")).toBe(true);

    expect(findByType(keywords, "price")).toEqual({
      type: "price",
      value: 20000000,
    });

  });

  it("extracts MacBook RAM", () => {

    const keywords = extractKeywords(
      "Mình muốn mua MacBook 16GB"
    );

    expect(hasKeyword(keywords, "macbook")).toBe(true);

    expect(findByType(keywords, "ram")).toEqual({
      type: "ram",
      value: "16GB",
    });

  });

  it("extracts MacBook silver color", () => {

    const keywords = extractKeywords(
      "Mình muốn mua MacBook màu bạc"
    );

    expect(hasKeyword(keywords, "macbook")).toBe(true);

    expect(findByType(keywords, "color")).toEqual({
      type: "color",
      value: "bạc",
    });

  });

  it("extracts Dell brand and office demand", () => {

    const keywords = extractKeywords(
      "Cần laptop Dell văn phòng pin tốt, nhẹ"
    );

    expect(hasKeyword(keywords, "dell")).toBe(true);

    expect(hasKeyword(keywords, "văn phòng")).toBe(true);

  });

});