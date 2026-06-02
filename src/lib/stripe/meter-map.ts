import type { CreditType } from "@/lib/credits/credits";

// Keys must match Stripe Billing Meter event_name values created in the dashboard.
// Placeholder mapping over IndieKit's default credit types; revisit when wedge types land.
export const CREDIT_TYPE_TO_METER_NAME: Record<CreditType, string> = {
  image_generation: "image_generation_credits",
  video_generation: "video_generation_credits",
};
