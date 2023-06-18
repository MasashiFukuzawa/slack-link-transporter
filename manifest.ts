import { Manifest } from "deno-slack-sdk/mod.ts";
import GoogleProvider from "./external_auth/google_provider.ts";
import transportUrlsWorkflow from "./workflows/transport_urls.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "slack-link-transporter",
  description:
    "Automatically transport URLs posted in Slack to your spreadsheet",
  icon: "assets/default_new_app_icon.png",
  workflows: [transportUrlsWorkflow],
  externalAuthProviders: [GoogleProvider],
  outgoingDomains: ["sheets.googleapis.com"],
  botScopes: ["commands"],
});
