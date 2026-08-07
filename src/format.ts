import { CALIBRATION_LIMITS } from "./constants";
import type { CalibrationMessage } from "./capnp";
import type { RouteInfo } from "./routes";

export function radiansToDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

export function formatDegrees(value: number): string {
  return `${radiansToDegrees(value).toFixed(2)}°`;
}

export function formatAngle(value: number | undefined): string {
  return value === undefined ? "n/a" : formatDegrees(value);
}

export function formatLogMonoTime(value: bigint): string {
  return `${value.toString()} ns`;
}

export function formatDetectedVehicle(make: string | undefined, platform: string | undefined): string | null {
  const makeLabel = make?.trim() ? titleCaseToken(make.trim()) : "";
  const platformParts = platform?.trim().split(/[_\s]+/).filter(Boolean) ?? [];
  if (makeLabel && platformParts[0]?.toLowerCase() === make?.trim().toLowerCase()) {
    platformParts.shift();
  }
  const modelLabel = platformParts.map(formatVehicleToken).join(" ");
  return [makeLabel, modelLabel].filter(Boolean).join(" ") || null;
}

function formatVehicleToken(token: string): string {
  if (/^(?:EV|HEV|PHEV|EUV|SUV|AWD|RWD|FWD|TSS\d*|[A-Z]{1,3}\d+[A-Z0-9]*)$/i.test(token)) {
    return token.toUpperCase();
  }
  if (/^\d+(?:ST|ND|RD|TH)$/i.test(token)) {
    return token.toLowerCase();
  }
  return titleCaseToken(token);
}

function titleCaseToken(token: string): string {
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export function deviceLimitKey(routeInfo: RouteInfo | null): keyof typeof CALIBRATION_LIMITS {
  return routeInfo?.deviceType === "mici" || routeInfo?.devicetype === 7 ? "mici" : "default";
}

export function yawDirection(yaw: number): string {
  if (Math.abs(yaw) < 0.0001) return "centered";
  return yaw > 0 ? "left" : "right";
}

export function yawCorrectionDirection(yaw: number): "left" | "right" | "center" {
  if (Math.abs(yaw) < 0.0001) return "center";
  return yaw > 0 ? "right" : "left";
}

export function pitchDirection(pitch: number): string {
  if (Math.abs(pitch) < 0.0001) return "level";
  return pitch > 0 ? "down" : "up";
}

export function adjustmentHint(value: number, axis: "pitch" | "yaw"): string {
  if (Math.abs(value) < 0.0001) return "Already near 0°.";
  if (axis === "pitch") {
    return value > 0 ? "To get closer to 0°, aim the device more up." : "To get closer to 0°, aim the device more down.";
  }
  return value > 0
    ? "To get closer to 0°, twist the device clockwise to the right."
    : "To get closer to 0°, twist the device counterclockwise to the left.";
}

export function withinLimits(message: CalibrationMessage, routeInfo: RouteInfo | null): boolean {
  const limits = CALIBRATION_LIMITS[deviceLimitKey(routeInfo)];
  const pitch = message.rpyCalib[1];
  const yaw = message.rpyCalib[2];
  if (!Number.isFinite(pitch) || !Number.isFinite(yaw)) return false;
  return pitch > limits.pitchMinRad && pitch < limits.pitchMaxRad && yaw > limits.yawMinRad && yaw < limits.yawMaxRad;
}

export function isInvalidCalibration(message: CalibrationMessage, routeInfo: RouteInfo | null): boolean {
  return message.rpyCalib.length === 3 && (message.status === 2 || !withinLimits(message, routeInfo));
}
