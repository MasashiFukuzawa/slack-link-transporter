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
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
    },
    required: ["interactivity"],
  },
});

/**
 * For collecting input from users, we recommend the
 * built-in OpenForm function as a first step.
 * https://api.slack.com/automation/functions#open-a-form
 */
const textForm = transportUrlsWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Transport URLs",
    description: "Transport URLs",
    interactivity: transportUrlsWorkflow.inputs.interactivity,
    submit_label: "Post",
    fields: {
      elements: [{
        name: "text",
        title: "Text",
        type: Schema.types.string,
        description: "Text posted in channel (Not always a URL)",
      }],
      required: ["text"],
    },
  },
);

transportUrlsWorkflow.addStep(transportUrlFunctionDefinition, {
  googleAccessTokenId: { credential_source: "DEVELOPER" },
  text: textForm.outputs.fields.text,
});

export default transportUrlsWorkflow;
