import supertest from "supertest";
import app from "../src/server";
import { CreateCategoryUseCase } from "../src/usecases/createCategory/CreateCategoryUseCase";

const request = supertest(app);
jest.mock("../src/usecases/createCategory/CreateCategoryUseCase");

describe("Category Controller crateCategory throw 500", () => {
  test("Should throw an error when CreateCategoryUseCase.execute throws an error", async () => {
    (CreateCategoryUseCase as jest.Mock).mockImplementationOnce(() => ({
      execute: jest.fn().mockRejectedValueOnce(new Error()),
    }));

    const response = await request.post("/api/v1/category").send({
      name: "any-name",
      icon: "any-icon",
    });

    expect(response.body.statusCode).toBe(500);
    expect(response.body.body.error).toEqual("Internal Server Error");
    expect(response.body).toEqual({
      statusCode: 500,
      body: { error: "Internal Server Error" },
    });
  });
});