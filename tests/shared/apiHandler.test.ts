import { describe, expect, test } from "bun:test";
import { toErrorResponse } from "@/lib/shared/apiHandler";
import { UpstreamError } from "@/lib/shared/errors";

describe("toErrorResponse", () => {
  test("maps TimeoutError to 504 instead of 500", async () => {
    const error = new DOMException("The operation was aborted due to timeout", "TimeoutError");
    const response = toErrorResponse(error);
    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({ error: "Upstream request timed out" });
  });

  test("keeps UpstreamError status", async () => {
    const response = toErrorResponse(UpstreamError.timeout("https://example.com/x"));
    expect(response.status).toBe(504);
  });

  test("unknown errors stay 500", async () => {
    const response = toErrorResponse(new Error("boom"));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });
});
