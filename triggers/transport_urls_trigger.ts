import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import { Trigger } from "deno-slack-sdk/types.ts";
import transportUrlsWorkflow from "../workflows/transport_urls.ts";

/**
 * Triggers determine when workflows are executed. A trigger
 * file describes a scenario in which a workflow should be run,
 * such as a user pressing a button or when a specific event occurs.
 * https://api.slack.com/automation/triggers
 */
const transportUrlsTrigger: Trigger<typeof transportUrlsWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Transport URLs",
  description: "Transport URLs to the Google Sheet",
  workflow: `#/workflows/${transportUrlsWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
  },
};

export default transportUrlsTrigger;
