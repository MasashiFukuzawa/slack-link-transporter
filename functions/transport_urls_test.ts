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
    text: [
      {
        text: {
          text: "<https://example.com>",
          type: "mrkdwn",
          verbatim: false,
        },
        type: "section",
        block_id: "v43o5",
      },
    ],
  };

  const { error } = await transportUrlFunction(createContext({ inputs }));
  assertEquals(error?.includes("Invalid token"), true);
});

Deno.test("Transport a http URL", async () => {
  const inputs = {
    googleAccessTokenId: "VALID_TOKEN_ID",
    text: [
      {
        text: {
          text: "<http://example.com>",
          type: "mrkdwn",
          verbatim: false,
        },
        type: "section",
        block_id: "v43o5",
      },
    ],
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
    text: [
      {
        text: {
          text: "<https://example.com>",
          type: "mrkdwn",
          verbatim: false,
        },
        type: "section",
        block_id: "v43o5",
      },
    ],
  };

  const { outputs, error } = await transportUrlFunction(
    createContext({ inputs }),
  );
  assertEquals(error, undefined);
  assertEquals(outputs?.text, "https://example.com");
});

Deno.test("Skip when text is not URL", async () => {
  const inputs = {
    googleAccessTokenId: "VALID_TOKEN_ID",
    text: [
      {
        text: { text: "plain text", type: "mrkdwn", verbatim: false },
        type: "section",
        block_id: "v43o5",
      },
    ],
  };

  const { outputs, error } = await transportUrlFunction(
    createContext({ inputs }),
  );
  assertEquals(error, undefined);
  assertEquals(outputs?.text, "plain text");
});

Deno.test("Skip when extra text includes", async () => {
  const inputs = {
    googleAccessTokenId: "VALID_TOKEN_ID",
    text: [
      {
        text: {
          text: "test\n<https://example.com>",
          type: "mrkdwn",
          verbatim: false,
        },
        type: "section",
        block_id: "v43o5",
      },
    ],
  };

  const { outputs, error } = await transportUrlFunction(
    createContext({ inputs }),
  );
  assertEquals(error, undefined);
  assertEquals(outputs?.text, "test\n<https://example.com>");
});

Deno.test("Skip when google docs", async () => {
  const inputs = {
    googleAccessTokenId: "VALID_TOKEN_ID",
    text: [
      {
        text: {
          text: "<https://docs.google.com>",
          type: "mrkdwn",
          verbatim: false,
        },
        type: "section",
        block_id: "v43o5",
      },
    ],
  };

  const { outputs, error } = await transportUrlFunction(
    createContext({ inputs }),
  );
  assertEquals(error, undefined);
  assertEquals(outputs?.text, "<https://docs.google.com>");
});

Deno.test("Skip when google drive", async () => {
  const inputs = {
    googleAccessTokenId: "VALID_TOKEN_ID",
    text: [
      {
        text: {
          text: "<https://drive.google.com>",
          type: "mrkdwn",
          verbatim: false,
        },
        type: "section",
        block_id: "v43o5",
      },
    ],
  };

  const { outputs, error } = await transportUrlFunction(
    createContext({ inputs }),
  );
  assertEquals(error, undefined);
  assertEquals(outputs?.text, "<https://drive.google.com>");
});
