import { eventType, staticSchema } from "inngest";

import { inngest } from "../client";

export const testHelloWorld = eventType("test/hello.world", {
  schema: staticSchema<{ email: string }>(),
});

export const helloWorld = inngest.createFunction(
  // TIP: Follow https://www.inngest.com/docs/features/inngest-functions/steps-workflows to learn more
  { id: "hello-world", triggers: [testHelloWorld] },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);
