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

class EnvVarMap {
  map: Map<string, string | null>;

  constructor() {
    this.map = new Map<string, string | null>();
  }

  populate(entries: Array<[string, string | null]>) {
    for (const [k, v] of entries) {
      this.map.set(k, v);
    }
  }

  get(key: string): string | null {
    // Collapse undefined to null:
    return this.map.get(key) ?? null;
  }
}

export let envVarMap = new EnvVarMap();

export const envVarOrFail = (varName: string): string => {
  const maybeVarValue = allViteEnvVars.get(varName);
  if (maybeVarValue == null) {
    throw new Error(`env.var ${varName} missing`);
  }
  return maybeVarValue;
};

export const envVarOrDefault = (
  varName: string,
  defaultValue: string
): string => {
  const maybeVarValue = allViteEnvVars.get(varName);
  return maybeVarValue ?? defaultValue;
};

export const pathWithinApp = (path: string): string => {
  const prefix = import.meta.env.BASE_URL;

  // BASE_URL should either be "/" or "/some/multi-component/path/",
  // so should always end with exactly one "/".
  const oneTrailingSlash = new RegExp("(^|[^/])/$");
  if (!prefix.match(oneTrailingSlash)) {
    throw new Error(`BASE_URL "${prefix}" does not end with exactly one '/'`);
  }

  // Similarly, `path` should start with exactly one "/".
  const oneLeadingSlash = new RegExp("^/($|[^/])");
  if (!path.match(oneLeadingSlash)) {
    throw new Error(`path "${path}" does not start with exactly one '/'`);
  }

  // Now we can correctly join the parts.
  const pathTail = path.substring(1);
  const fullPath = `${prefix}${pathTail}`;

  return fullPath;
};

export const urlWithinApp = (path: string) => {
  let url = new URL(window.location.toString());
  url.pathname = pathWithinApp(path);
  return url.toString();
};

/** Makes the given URL be within the main site.  This is to allow
 * deployments other than to the root of the domain.  The environment
 * variable VITE_DEPLOY_BASE_URL gives the site's base URL. */
export const withinSite = (url: string) => {
  return envVarOrFail("VITE_DEPLOY_BASE_URL") + url;
};
