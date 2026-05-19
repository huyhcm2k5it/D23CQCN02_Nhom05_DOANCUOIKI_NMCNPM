jest.mock("../../../utils/catchAsync", () => (fn) => fn);

jest.mock("../../../models/userModel", () => ({
  findByIdAndUpdate: jest.fn(),
}));

jest.mock("../../../controllers/handlerFactory", () => ({
  getOne: jest.fn(),
  getAll: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn(),
  getTable: jest.fn(),
}));

const User = require("../../../models/userModel");
const userController = require("../../../controllers/userController");

const buildResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("filterObj used by updateMe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    User.findByIdAndUpdate.mockResolvedValue({ id: "user-1" });
  });

  it("returns only allowed fields from a request body with name, role, password, avatar, and phone", async () => {
    const req = {
      user: { id: "user-1" },
      body: {
        name: "Nguyen Van A",
        role: "admin",
        password: "",
        avatar: "avatar.jpg",
        phone: "0901234567",
      },
    };
    const res = buildResponse();
    const next = jest.fn();

    await userController.updateMe(req, res, next);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "user-1",
      {
        name: "Nguyen Van A",
        avatar: "avatar.jpg",
        phone: "0901234567",
      },
      {
        new: true,
        runValidators: true,
      }
    );
  });

  it("removes restricted fields like role and password", async () => {
    const req = {
      user: { id: "user-1" },
      body: {
        role: "admin",
        password: "",
      },
    };
    const res = buildResponse();
    const next = jest.fn();

    await userController.updateMe(req, res, next);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "user-1",
      {},
      expect.any(Object)
    );
  });

  it("handles an empty request body", async () => {
    const req = {
      user: { id: "user-1" },
      body: {},
    };
    const res = buildResponse();
    const next = jest.fn();

    await userController.updateMe(req, res, next);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "user-1",
      {},
      expect.any(Object)
    );
  });

  it("keeps allowed fields with undefined values and removes restricted undefined fields", async () => {
    const req = {
      user: { id: "user-1" },
      body: {
        name: undefined,
        avatar: undefined,
        role: undefined,
      },
    };
    const res = buildResponse();
    const next = jest.fn();

    await userController.updateMe(req, res, next);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      "user-1",
      {
        name: undefined,
        avatar: undefined,
      },
      expect.any(Object)
    );
  });
});
