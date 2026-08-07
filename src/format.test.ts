import { describe, expect, it } from "vitest";
import { adjustmentHint, formatDetectedVehicle, yawCorrectionDirection } from "./format";

describe("adjustment hints", () => {
  it("describes negative yaw correction as counterclockwise left", () => {
    expect(adjustmentHint(-0.02, "yaw")).toBe("To get closer to 0°, twist the device counterclockwise to the left.");
  });

  it("describes positive yaw correction as clockwise right", () => {
    expect(adjustmentHint(0.02, "yaw")).toBe("To get closer to 0°, twist the device clockwise to the right.");
  });

  it("keeps near-zero yaw neutral", () => {
    expect(adjustmentHint(0.00001, "yaw")).toBe("Already near 0°.");
  });

  it("animates negative yaw toward the left", () => {
    expect(yawCorrectionDirection(-0.02)).toBe("left");
  });

  it("animates positive yaw toward the right", () => {
    expect(yawCorrectionDirection(0.02)).toBe("right");
  });

  it("does not animate near-zero yaw", () => {
    expect(yawCorrectionDirection(0.00001)).toBe("center");
  });
});

describe("detected vehicle formatting", () => {
  it("combines route make and platform without repeating the make", () => {
    expect(formatDetectedVehicle("hyundai", "HYUNDAI_TUCSON_HEV_2025")).toBe("Hyundai Tucson HEV 2025");
  });

  it("returns null when route metadata has no vehicle identity", () => {
    expect(formatDetectedVehicle(undefined, undefined)).toBeNull();
  });
});
