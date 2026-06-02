import { getStripe } from "@/lib/stripe";

export async function reportMeterEvent(params: {
  stripeCustomerId: string;
  meterEventName: string;
  value: number;
  identifier: string;
}): Promise<{ reported: boolean; reason?: string }> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { reported: false, reason: "stripe_not_configured" };
  }

  await getStripe().billing.meterEvents.create({
    event_name: params.meterEventName,
    payload: {
      stripe_customer_id: params.stripeCustomerId,
      value: String(params.value),
    },
    identifier: params.identifier,
  });

  return { reported: true };
}
