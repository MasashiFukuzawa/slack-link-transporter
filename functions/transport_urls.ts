import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

// Configuration information for the storing spreadsheet
// https://developers.google.com/sheets/api/guides/concepts#expandable-1
const GOOGLE_SPREADSHEET_RANGE = "A2:C2";

/**
 * Functions are reusable building blocks of automation that accept
 * inputs, perform calculations, and provide outputs. Functions can
 * be used independently or as steps in workflows.
 * https://api.slack.com/automation/functions/custom
 */
export const transportUrlFunctionDefinition = DefineFunction({
  callback_id: "transport_urls_function",
  title: "Transport URLs posted in channel on a Google sheet",
  description: "Transport URLs posted in channel on a Google sheet",
  source_file: "functions/transport_urls.ts",
  input_parameters: {
    properties: {
      googleAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "google",
      },
      text: {
        type: Schema.types.string,
        description: "Text posted in channel (Not always a URL)",
      },
    },
    required: [
      "googleAccessTokenId",
      "text",
    ],
  },
  output_parameters: {
    properties: {
      text: {
        type: Schema.types.string,
        description: "Text posted in channel (Not always a URL)",
      },
    },
    required: ["text"],
  },
});

export default SlackFunction(
  transportUrlFunctionDefinition,
  async ({ inputs, client, env }) => {
    const { text } = inputs;

    if (!text.match(/^http(s)?:\/\//)) {
      return { outputs: { text } };
    }

    // Collect Google access token
    const auth = await client.apiCall("apps.auth.external.get", {
      external_token_id: inputs.googleAccessTokenId,
    });

    if (!auth.ok) {
      return { error: `Failed to collect Google auth token: ${auth.error}` };
    }

    // Append times to spreadsheet
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SPREADSHEET_ID}/values/${GOOGLE_SPREADSHEET_RANGE}:append?valueInputOption=USER_ENTERED`;
    const sheets = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${auth.external_token}`,
      },
      body: JSON.stringify({
        range: GOOGLE_SPREADSHEET_RANGE,
        majorDimension: "ROWS",
        values: [["", "", text]],
      }),
    });

    if (!sheets.ok) {
      return {
        error:
          `Failed to transport a url to the Google sheet: ${sheets.statusText}`,
      };
    }

    return { outputs: { text } };
  },
);
