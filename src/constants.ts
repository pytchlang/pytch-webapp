export const stageWidth = 480;
export const stageHeight = 360;

export const stageHalfWidth = 0.5 * stageWidth;
export const stageHalfHeight = 0.5 * stageHeight;

export const stageFullScreenBorderPx = 16;

export const liveReloadEnabled =
  process.env.REACT_APP_ENABLE_LIVE_RELOAD_WEBSOCKET === "yes";

export const liveReloadURL = "ws://127.0.0.1:4111/";
