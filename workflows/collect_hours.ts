import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { SaveHoursFunctionDefinition } from "../functions/save_hours.ts";

/**
 * A workflow is a set of steps that are executed in order.
 * Each step in a workflow is a function.
 * https://api.slack.com/automation/workflows
 */
const CollectHoursWorkflow = DefineWorkflow({
  callback_id: "collect_hours",
  title: "Collect billable hours",
  description: "Gather and save timesheet info to a Google sheet",
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
const timesheetForm = CollectHoursWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Collect hours",
    description: "Log the hours you've worked into a timesheet",
    interactivity: CollectHoursWorkflow.inputs.interactivity,
    submit_label: "Save",
    fields: {
      elements: [{
        name: "text",
        title: "Text",
        type: Schema.types.string,
        description: "Total break time in minutes",
      }],
      required: ["text"],
    },
  },
);

CollectHoursWorkflow.addStep(SaveHoursFunctionDefinition, {
  googleAccessTokenId: { credential_source: "DEVELOPER" },
  text: timesheetForm.outputs.fields.text,
});

export default CollectHoursWorkflow;
