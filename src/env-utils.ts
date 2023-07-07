// This is a bit repetitive, but Vite does not support dynamic expansion
// of env.vars.  Gather all the ones we use in one place.
const allViteEnvVars = new Map<string, string | null>([
  ["VITE_DEMOS_BASE", import.meta.env.VITE_DEMOS_BASE],
  ["VITE_DEPLOY_BASE_URL", import.meta.env.VITE_DEPLOY_BASE_URL],
  ["VITE_LIVE_RELOAD_WEBSOCKET", import.meta.env.VITE_LIVE_RELOAD_WEBSOCKET],
  ["VITE_GOOGLE_API_KEY", import.meta.env.VITE_GOOGLE_API_KEY],
  ["VITE_GOOGLE_APP_ID", import.meta.env.VITE_GOOGLE_APP_ID],
  ["VITE_GOOGLE_CLIENT_ID", import.meta.env.VITE_GOOGLE_CLIENT_ID],
  ["VITE_MEDIALIB_BASE", import.meta.env.VITE_MEDIALIB_BASE],
  ["VITE_SKULPT_BASE", import.meta.env.VITE_SKULPT_BASE],
  ["VITE_TUTORIALS_BASE", import.meta.env.VITE_TUTORIALS_BASE],
  ["VITE_USE_REAL_GOOGLE_DRIVE", import.meta.env.VITE_USE_REAL_GOOGLE_DRIVE],
  ["VITE_VERSION_TAG", import.meta.env.VITE_VERSION_TAG],
]);

export const envVarOrFail = (varName: string): string => {
  const maybeVarValue = allViteEnvVars.get(varName);
  if (maybeVarValue == null) {
    throw new Error(`env.var ${varName} missing`);
  }
  return maybeVarValue;
};
