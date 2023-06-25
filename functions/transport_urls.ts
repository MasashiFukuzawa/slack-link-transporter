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
        type: Schema.slack.types.rich_text,
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
        type: Schema.slack.types.rich_text,
        description: "Text posted in channel (Not always a URL)",
      },
    },
    required: ["text"],
  },
});

const extractUrl = (input: string): string => {
  const regex = /<([^>]+)>/;
  const match = input.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  throw new Error(`Failed to extract URL from ${input}`);
};

export default SlackFunction(
  transportUrlFunctionDefinition,
  async ({ inputs, client, env }) => {
    /**
    example of inputs is:
      inputs {
        text: [{
          text: { text: "test\n<https://example.com>", type: "mrkdwn", verbatim: false },
          type: "section",
          block_id: "v43o5"
        }],
        googleAccessTokenId: "sample_token_id"
      }
    */
    const text: string = inputs.text[0].text.text;
    const trimmedText = text.trim();

    // Matches lines that start with `<http(s)`, end with `>`,
    // have no other strings before or after,
    // and do not span multiple lines or include multiple URLs or only whitespace
    if (!trimmedText.match(/^(?!^\s*$)<https?:\/\/[^>\n]+>$/)) {
      console.log(`Not a URL: ${text}`);
      return { outputs: { text } };
    }

    // Ignore webpages with authentication
    // If you need other exceptions, add them here
    if (trimmedText.match(/docs.google.com|drive.google.com/)) {
      console.log(`Not target: ${text}`);
      return { outputs: { text } };
    }

    const extractedUrl = extractUrl(trimmedText);

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
        values: [["", "", extractedUrl]],
      }),
    });

    if (!sheets.ok) {
      return {
        error:
          `Failed to transport a url to the Google sheet: ${sheets.statusText}`,
      };
    }

    return { outputs: { text: extractedUrl } };
  },
);
