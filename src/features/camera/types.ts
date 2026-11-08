export type CameraStatus =
  | "off" // not requested (demo mode)
  | "starting"
  | "live"
  | "denied" // user/browser refused permission
  | "unavailable" // no camera, or insecure context
  | "error"; // camera busy / failed, will retry

export interface CameraInfo {
  status: CameraStatus;
  /** Human-readable reason, for the technician menu / operator only. */
  detail: string | null;
  width: number | null;
  height: number | null;
}
