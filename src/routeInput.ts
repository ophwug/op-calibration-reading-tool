export const ROUTE_QUERY_PARAM = "route";

export interface ParsedRouteInput {
  routeName: string;
  canonicalInput: string;
  dongleId: string;
  routeId: string;
  segment: number | null;
  source: "route" | "connect-url";
}

export function parseRouteInput(input: string): ParsedRouteInput {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Paste a public comma Connect URL or route name first.");

  if (trimmed.startsWith("https://connect.comma.ai/")) {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      throw new Error("Connect URLs need at least /<dongle>/<route> in the path.");
    }
    const [dongleId, routeId] = parts;
    const segment = segmentFromTrailingParts(parts.slice(2));
    const routeName = `${dongleId}|${routeId}`;
    return {
      routeName,
      canonicalInput: canonicalRouteInput(routeName, segment),
      dongleId,
      routeId,
      segment,
      source: "connect-url",
    };
  }

  const separatorIndex = trimmed.search(/[|/]/);
  const dongleId = separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : "";
  const routeParts = separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1).split("/").filter(Boolean) : [];
  const [routeId, ...trailingParts] = routeParts;
  if (!dongleId || !routeId) {
    throw new Error("Route names should look like dongle_id|route_id.");
  }
  const routeName = `${dongleId}|${routeId}`;
  const segment = segmentFromTrailingParts(trailingParts);

  return {
    routeName,
    canonicalInput: canonicalRouteInput(routeName, segment),
    dongleId,
    routeId,
    segment,
    source: "route",
  };
}

function segmentFromTrailingParts(parts: string[]): number | null {
  if (parts.length !== 1 || !/^\d+$/.test(parts[0])) return null;
  const segment = Number(parts[0]);
  return Number.isSafeInteger(segment) ? segment : null;
}

function canonicalRouteInput(routeName: string, segment: number | null): string {
  return segment === null ? routeName : `${routeName}/${segment}`;
}

export function routeInputFromUrl(urlLike: string | URL): string | null {
  const url = typeof urlLike === "string" ? new URL(urlLike, "https://example.test") : urlLike;
  const rawRoute = url.searchParams.get(ROUTE_QUERY_PARAM);
  if (!rawRoute?.trim()) return null;

  try {
    return parseRouteInput(rawRoute).canonicalInput;
  } catch {
    return null;
  }
}

export function buildRouteShareUrl(origin: string, basePath: string, routeInput: string): string {
  const canonicalInput = parseRouteInput(routeInput).canonicalInput;
  const url = new URL(basePath || "/", origin);
  url.searchParams.set(ROUTE_QUERY_PARAM, canonicalInput);
  return url.toString();
}

export function buildAuthCallbackCleanUrl(currentHref: string, basePath: string): string {
  const currentUrl = new URL(currentHref);
  const cleanedUrl = new URL(basePath || "/", currentUrl.origin);
  const routeName = routeInputFromUrl(currentUrl);
  if (routeName) cleanedUrl.searchParams.set(ROUTE_QUERY_PARAM, routeName);
  return cleanedUrl.toString();
}
