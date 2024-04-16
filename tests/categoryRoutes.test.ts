import supertest from "supertest";
import app from "../src/server";
import { execSync } from "child_process";

const request = supertest(app);
beforeAll(() => {
  execSync("npm run seed-db");
});

describe("Category Controller crateCategory", () => {
  test("Should return 400 if no name is provided", async () => {
    const { body } = await request
      .post("/api/v1/category")
      .send({
        icon: "any-icon",
      })
      .expect(400);
    expect(body.statusCode).toBe(400);
    expect(body.body).toEqual({ message: "Missing param: name" });
  });

  test("Should return 400 if no icon is provided", async () => {
    const { body } = await request
      .post("/api/v1/category")
      .send({
        name: "any-name",
      })
      .expect(400);
    expect(body.statusCode).toBe(400);
    expect(body.body).toEqual({ message: "Missing param: icon" });
  });

  test("Should return 201 with correct values that were provided", async () => {
    const { body } = await request
      .post("/api/v1/category")
      .send({
        name: "any-name",
        icon: "any-icon",
      })
      .expect(201);
    const category = body.body;
    expect(body.statusCode).toBe(201);
    expect(category.name).toBe("any-name");
    expect(category.icon).toBe("any-icon");
  });

  test("Should return correct category model", async () => {
    const { body } = await request.post("/api/v1/category").send({
      name: "any-name",
      icon: "any-icon",
    });
    const category = body.body;
    expect(category).toHaveProperty("id");
    expect(category).toHaveProperty("name");
    expect(category).toHaveProperty("icon");
    expect(category).toHaveProperty("createdAt");
    expect(category).toHaveProperty("updatedAt");
  });
});