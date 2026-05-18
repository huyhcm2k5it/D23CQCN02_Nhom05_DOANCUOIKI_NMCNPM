const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../../../models/userModel");

const buildMockUser = (overrides = {}) =>
  new User({
    name: "Nguyen Van A",
    email: "nguyenvana@example.com",
    password: "Password123",
    passwordConfirm: "Password123",
    ...overrides,
  });

describe("User model methods", () => {
  describe("correctPassword", () => {
    it("returns true for a valid password", async () => {
      const user = buildMockUser();
      const hashedPassword = await bcrypt.hash("Password123", 12);

      await expect(
        user.correctPassword("Password123", hashedPassword)
      ).resolves.toBe(true);
    });

    it("returns false for an invalid password", async () => {
      const user = buildMockUser();
      const hashedPassword = await bcrypt.hash("Password123", 12);

      await expect(
        user.correctPassword("WrongPassword123", hashedPassword)
      ).resolves.toBe(false);
    });
  });

  describe("createVerifyToken", () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("generates a verify token", () => {
      const user = buildMockUser();

      const verifyToken = user.createVerifyToken();

      expect(verifyToken).toEqual(expect.any(String));
      expect(verifyToken).toHaveLength(6);
      expect(verifyToken).toMatch(/^[a-f0-9]+$/);
    });

    it("stores the hashed token in userVerifyToken", () => {
      const user = buildMockUser();

      const verifyToken = user.createVerifyToken();
      const expectedHash = crypto
        .createHash("sha256")
        .update(verifyToken)
        .digest("hex");

      expect(user.userVerifyToken).toBe(expectedHash);
      expect(user.userVerifyToken).not.toBe(verifyToken);
    });
  });
});