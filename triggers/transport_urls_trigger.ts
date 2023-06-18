import {
  TriggerContextData,
  TriggerEventTypes,
  TriggerTypes,
} from "deno-slack-api/mod.ts";
import { Trigger } from "deno-slack-sdk/types.ts";

import transportUrlsWorkflow from "../workflows/transport_urls.ts";

/**
 * Triggers determine when workflows are executed. A trigger
 * file describes a scenario in which a workflow should be run,
 * such as a user pressing a button or when a specific event occurs.
 * https://api.slack.com/automation/triggers
 */
const transportUrlsTrigger: Trigger<typeof transportUrlsWorkflow.definition> = {
  type: TriggerTypes.Event,
  name: "Transport URLs",
  description: "Transport URLs to the Google Sheet",
  workflow: `#/workflows/${transportUrlsWorkflow.definition.callback_id}`,
  event: {
    event_type: TriggerEventTypes.MessagePosted,
    channel_ids: ["<YOUR_SLACK_CHANNEL_ID>"], // TODO: Add Channel ID here!
    filter: {
      version: 1,
      root: {
        // specific user and message contains a URL
        operator: "AND",
        inputs: [
          {
            operator: "OR",
            inputs: [
              {
                statement: "{{data.user_id}} == <YOUR_SLACK_USER_ID>", // TODO: Add User ID here!
              },
            ],
          },
          {
            operator: "OR",
            inputs: [
              {
                statement: "{{data.text}} CONTAINS http://",
              },
              {
                statement: "{{data.text}} CONTAINS https://",
              },
            ],
          },
        ],
      },
    },
  },
  inputs: {
    text: {
      value: TriggerContextData.Event.MessagePosted.text,
    },
  },
};

export default transportUrlsTrigger;
