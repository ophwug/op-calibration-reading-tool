import { describe, expect, it } from "vitest";
import { parseRouteInput, segmentFromUrl } from "./routes";
import { buildAuthCallbackCleanUrl, buildRouteShareUrl, routeInputFromUrl } from "./routeInput";

describe("route parsing", () => {
  it("accepts route names", () => {
    expect(parseRouteInput("5beb9b58bd12b691|0000010a--a51155e496")).toMatchObject({
      routeName: "5beb9b58bd12b691|0000010a--a51155e496",
      dongleId: "5beb9b58bd12b691",
      routeId: "0000010a--a51155e496",
    });
  });

  it("accepts comma Connect URLs", () => {
    expect(parseRouteInput("https://connect.comma.ai/5beb9b58bd12b691/0000010a--a51155e496")).toMatchObject({
      routeName: "5beb9b58bd12b691|0000010a--a51155e496",
      source: "connect-url",
    });
  });

  it("strips dragged-along clip times from comma Connect URLs", () => {
    expect(parseRouteInput("https://connect.comma.ai/5beb9b58bd12b691/0000010a--a51155e496/90/105")).toMatchObject({
      routeName: "5beb9b58bd12b691|0000010a--a51155e496",
      source: "connect-url",
    });
  });

  it("parses a single trailing Connect path number as a segment", () => {
    expect(parseRouteInput("https://connect.comma.ai/5beb9b58bd12b691/0000010a--a51155e496/1")).toMatchObject({
      routeName: "5beb9b58bd12b691|0000010a--a51155e496",
      canonicalInput: "5beb9b58bd12b691|0000010a--a51155e496/1",
      segment: 1,
    });
  });

  it("parses a single trailing route-name number as a segment", () => {
    expect(parseRouteInput("5beb9b58bd12b691/0000010a--a51155e496/1")).toMatchObject({
      routeName: "5beb9b58bd12b691|0000010a--a51155e496",
      canonicalInput: "5beb9b58bd12b691|0000010a--a51155e496/1",
      segment: 1,
    });
  });

  it("extracts segment numbers from signed log URLs", () => {
    expect(segmentFromUrl("https://example.test/dongle/route/12/qlog.zst?sig=abc")).toBe(12);
    expect(segmentFromUrl("https://example.test/dongle/route/7/rlog.bz2")).toBe(7);
    expect(segmentFromUrl("https://example.test/dongle/route/1/qcamera.ts?sig=abc")).toBe(1);
  });

  it("builds share URLs on the configured app base path", () => {
    expect(buildRouteShareUrl("https://example.test", "/op-calibration-reading-tool/", "5beb9b58bd12b691|0000010a--a51155e496")).toBe(
      "https://example.test/op-calibration-reading-tool/?route=5beb9b58bd12b691%7C0000010a--a51155e496",
    );
  });

  it("canonicalizes Connect URLs in share URLs", () => {
    const shareUrl = buildRouteShareUrl(
      "https://example.test",
      "/",
      "https://connect.comma.ai/5beb9b58bd12b691/0000010a--a51155e496/90/105",
    );

    expect(routeInputFromUrl(shareUrl)).toBe("5beb9b58bd12b691|0000010a--a51155e496");
  });

  it("preserves an explicit segment in share URLs", () => {
    const shareUrl = buildRouteShareUrl(
      "https://example.test",
      "/",
      "https://connect.comma.ai/5beb9b58bd12b691/0000010a--a51155e496/1",
    );

    expect(routeInputFromUrl(shareUrl)).toBe("5beb9b58bd12b691|0000010a--a51155e496/1");
  });

  it("ignores empty and invalid route query params", () => {
    expect(routeInputFromUrl("https://example.test/?route=%20")).toBeNull();
    expect(routeInputFromUrl("https://example.test/?route=not-a-route")).toBeNull();
  });

  it("preserves route params when cleaning OAuth callback URLs", () => {
    expect(
      buildAuthCallbackCleanUrl(
        "https://example.test/op-calibration-reading-tool/?code=abc&provider=g&route=5beb9b58bd12b691%7C0000010a--a51155e496",
        "/op-calibration-reading-tool/",
      ),
    ).toBe("https://example.test/op-calibration-reading-tool/?route=5beb9b58bd12b691%7C0000010a--a51155e496");
  });
});
