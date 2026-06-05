import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoisted spy so the vi.mock factory can reference it safely.
const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ billing: { meterEvents: { create } } }),
}));

import { reportMeterEvent } from "./reportMeterEvent";

describe("reportMeterEvent", () => {
  const originalKey = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    create.mockReset();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = originalKey;
    }
  });

  it("no-ops (fail-safe) when STRIPE_SECRET_KEY is unset", async () => {
    delete process.env.STRIPE_SECRET_KEY;

    const result = await reportMeterEvent({
      stripeCustomerId: "cus_1",
      meterEventName: "image_generation_credits",
      value: 3,
      identifier: "id-1",
    });

    expect(result).toEqual({ reported: false, reason: "stripe_not_configured" });
    expect(create).not.toHaveBeenCalled();
  });

  it("reports a string-valued meter event with the dedup identifier when configured", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";

    const result = await reportMeterEvent({
      stripeCustomerId: "cus_1",
      meterEventName: "image_generation_credits",
      value: 3,
      identifier: "id-1",
    });

    expect(result).toEqual({ reported: true });
    expect(create).toHaveBeenCalledWith({
      event_name: "image_generation_credits",
      payload: { stripe_customer_id: "cus_1", value: "3" },
      identifier: "id-1",
    });
  });
});
