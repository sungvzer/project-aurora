import { Response } from "superagent";
import request from "supertest";
import { isValidResourceObject } from "../src/utils/customValidators";
import app from "../src/app";

describe("GET /routes", () => {
    let response: Response;

    beforeAll(async () => {
        response = await request(app).get("/routes").send();
    });

    test("Returns 200 status code", () => {
        expect(response.statusCode).toEqual(200);
    });

    test('Response has "data"', () => {
        expect(response.body).toHaveProperty("data");
        let data = response.body.data;
        expect(data).not.toBeNull();
        expect(data).not.toBeUndefined();
    });

    test("Data is valid resource", () => {
        expect(isValidResourceObject(response.body.data)).toBe(true);
    });

    test("Data attributes are names of HTTP methods", () => {
        const attributes = response.body.data.attributes;
        const methods = ["delete", "post", "put", "patch", "get"];
        for (let method of methods) {
            expect(attributes).toHaveProperty(method);
        }
    });
});
