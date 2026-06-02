import { db } from "@/db";
import { organizations } from "@/db/schema/organization";
import type { CreditType } from "@/lib/credits/credits";
import { CREDIT_TYPE_TO_METER_NAME } from "@/lib/stripe/meter-map";
import { reportMeterEvent } from "@/lib/stripe/reportMeterEvent";
import { eq } from "drizzle-orm";
import { eventType, staticSchema } from "inngest";

import { inngest } from "../client";

export const meterEventReport = eventType("billing/meter.event.report", {
  schema: staticSchema<{
    organizationId: string;
    creditType: CreditType;
    value: number;
    identifier: string;
  }>(),
});

export const reportMeterEventFn = inngest.createFunction(
  {
    id: "report-meter-event",
    retries: 5,
    triggers: [meterEventReport],
  },
  async ({ event, logger, step }) => {
    const { organizationId, creditType, value, identifier } = event.data;

    const meterEventName = CREDIT_TYPE_TO_METER_NAME[creditType];
    if (!meterEventName) {
      logger.info(`No meter mapped for creditType=${creditType}; skipping`);
      return { skipped: true, reason: "no_meter_mapping" };
    }

    const org = await step.run("lookup-stripe-customer", async () =>
      db
        .select({ stripeCustomerId: organizations.stripeCustomerId })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1)
    );

    const stripeCustomerId = org[0]?.stripeCustomerId;
    if (!stripeCustomerId) {
      logger.info(`Org ${organizationId} has no stripeCustomerId; skipping`);
      return { skipped: true, reason: "no_stripe_customer" };
    }

    const result = await step.run("report-to-stripe", async () =>
      reportMeterEvent({
        stripeCustomerId,
        meterEventName,
        value,
        identifier,
      })
    );

    return result;
  }
);
