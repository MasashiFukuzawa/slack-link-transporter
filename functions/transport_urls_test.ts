import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "https://deno.land/std@0.153.0/testing/asserts.ts";
import * as mf from "mock-fetch/mod.ts";
import transportUrlFunction from "./transport_urls.ts";

// Replaces globalThis.fetch with the mocked copy
mf.install();

mf.mock("POST@/api/apps.auth.external.get", async (args) => {
  const body = await args.formData();

  if (body.get("external_token_id") === "INVALID_TOKEN_ID") {
    return new Response(JSON.stringify({
      ok: false,
      error: "Invalid token",
    }));
  }

  return new Response(JSON.stringify({
    ok: true,
    external_token: "GOOGLE_ACCESS_TOKEN",
  }));
});

mf.mock("POST@/v4/spreadsheets/*/values/*:append", () => {
  return new Response(JSON.stringify({
    ok: true,
  }));
});

const { createContext } = SlackFunctionTester("transport_urls");

Deno.test("Fail on invalid auth token id", async () => {
  const inputs = {
    googleAccessTokenId: "INVALID_TOKEN_ID",
    text: "https://example.com",
  };

  const { error } = await transportUrlFunction(createContext({ inputs }));
  assertEquals(error?.includes("Invalid token"), true);
});

Deno.test("Transport a http URL", async () => {
  const inputs = {
    googleAccessTokenId: "VALID_TOKEN_ID",
    text: "http://example.com",
  };

  const { outputs, error } = await transportUrlFunction(
    createContext({ inputs }),
  );
  assertEquals(error, undefined);
  assertEquals(outputs?.text, "http://example.com");
});

Deno.test("Transport a https URL", async () => {
  const inputs = {
    googleAccessTokenId: "VALID_TOKEN_ID",
    text: "https://example.com",
  };

  const { outputs, error } = await transportUrlFunction(
    createContext({ inputs }),
  );
  assertEquals(error, undefined);
  assertEquals(outputs?.text, "https://example.com");
});

Deno.test("Do not raise error when text is not URL", async () => {
  const inputs = {
    googleAccessTokenId: "VALID_TOKEN_ID",
    text: "plain text",
  };

  const { outputs, error } = await transportUrlFunction(
    createContext({ inputs }),
  );
  assertEquals(error, undefined);
  assertEquals(outputs?.text, "plain text");
});
