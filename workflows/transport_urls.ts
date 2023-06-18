import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { transportUrlFunctionDefinition } from "../functions/transport_urls.ts";

/**
 * A workflow is a set of steps that are executed in order.
 * Each step in a workflow is a function.
 * https://api.slack.com/automation/workflows
 */
const transportUrlsWorkflow = DefineWorkflow({
  callback_id: "transport_urls_workflow",
  title: "Transport URLs",
  description: "Transport URLs to a Google sheet",
  input_parameters: {
    properties: {
      text: {
        description: "The message to respond to",
        type: Schema.types.string,
      },
    },
    required: ["text"],
  },
});

transportUrlsWorkflow.addStep(transportUrlFunctionDefinition, {
  googleAccessTokenId: { credential_source: "DEVELOPER" },
  text: transportUrlsWorkflow.inputs.text,
});

export default transportUrlsWorkflow;
