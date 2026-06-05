import { describe, it, expect } from "vitest";

import { CREDIT_TYPE_TO_METER_NAME } from "./meter-map";

describe("CREDIT_TYPE_TO_METER_NAME", () => {
  it("maps each known credit type to a stable meter event name", () => {
    expect(CREDIT_TYPE_TO_METER_NAME.image_generation).toBe(
      "image_generation_credits"
    );
    expect(CREDIT_TYPE_TO_METER_NAME.video_generation).toBe(
      "video_generation_credits"
    );
  });
});
