import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

// Configuration information for the storing spreadsheet
// https://developers.google.com/sheets/api/guides/concepts#expandable-1
const GOOGLE_SPREADSHEET_RANGE = "C2";

/**
 * Functions are reusable building blocks of automation that accept
 * inputs, perform calculations, and provide outputs. Functions can
 * be used independently or as steps in workflows.
 * https://api.slack.com/automation/functions/custom
 */
export const SaveHoursFunctionDefinition = DefineFunction({
  callback_id: "save_hours",
  title: "Save logged hours",
  description: "Store input hours in a Google sheet",
  source_file: "functions/save_hours.ts",
  input_parameters: {
    properties: {
      googleAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "google",
      },
      text: {
        type: Schema.types.string,
        description: "Minutes of break time taken",
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
        description: "Total number of hours worked",
      },
    },
    required: ["text"],
  },
});

export default SlackFunction(
  SaveHoursFunctionDefinition,
  async ({ inputs, client, env }) => {
    const { text } = inputs;

    if (!text.match(/https?:\/\//)) {
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
        values: [[text]],
      }),
    });

    if (!sheets.ok) {
      return {
        error: `Failed to save hours to the timesheet: ${sheets.statusText}`,
      };
    }

    return { outputs: { text } };
  },
);
