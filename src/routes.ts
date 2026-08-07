import { API_BASE_URL } from "./constants";
import { authHeaders, isSignedIn } from "./auth";
export { parseRouteInput, type ParsedRouteInput } from "./routeInput";

export interface RouteFiles {
  cameras?: string[];
  dcameras?: string[];
  ecameras?: string[];
  logs?: string[];
  qcameras?: string[];
  qlogs?: string[];
}

export interface RouteInfo {
  fullname: string;
  make?: string;
  deviceType?: string;
  dongle_id?: string;
  dongleId?: string;
  devicetype?: number;
  maxlog?: number;
  maxqlog?: number;
  platform?: string;
  version?: string;
  git_commit?: string;
  gitCommit?: string;
  git_branch?: string;
  gitBranch?: string;
}

export async function fetchRouteFiles(routeName: string): Promise<RouteFiles> {
  const response = await fetch(`${API_BASE_URL}/v1/route/${encodeURIComponent(routeName)}/files`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const accessHint = isSignedIn() ? " Your comma sign-in may not have access to this route." : " Make sure the route is public, or try signing in with comma.";
    throw new Error(
      `Could not read route files (${response.status}).${accessHint} Make sure its logs are uploaded.`,
    );
  }
  return response.json();
}

export async function fetchRouteInfo(routeName: string): Promise<RouteInfo | null> {
  const response = await fetch(`${API_BASE_URL}/v1/route/${encodeURIComponent(routeName)}/`, {
    headers: authHeaders(),
  });
  if (!response.ok) return null;
  return response.json();
}

export function orderedLogUrls(files: RouteFiles): string[] {
  const qlogs = sortBySegment(files.qlogs ?? []);
  if (qlogs.length > 0) return qlogs;
  return sortBySegment(files.logs ?? []);
}

export function orderedQcameraUrls(files: RouteFiles): string[] {
  return sortBySegment(files.qcameras ?? []);
}

export function logSourceLabel(files: RouteFiles): "qlogs" | "rlogs" | "none" {
  if ((files.qlogs ?? []).length > 0) return "qlogs";
  if ((files.logs ?? []).length > 0) return "rlogs";
  return "none";
}

export function segmentFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/(?:qlog|rlog|qcamera)\.(?:bz2|zst|ts)(?:\?|$)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function sortBySegment(urls: string[]): string[] {
  return [...urls].sort((a, b) => segmentFromUrl(a) - segmentFromUrl(b));
}
