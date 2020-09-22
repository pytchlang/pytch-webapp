export const withinApp = (url: string) => {
  return url[0] === "/" ? process.env.PUBLIC_URL + url : url;
};

export const delaySeconds = (seconds: number) => {
  const timeoutMs = PYTCH_CYPRESS()["instantDelays"] ? 0 : 1000.0 * seconds;
  return new Promise((r) => setTimeout(r, timeoutMs));
};

// To allow testing to hook into various aspects of behaviour:
const PYTCH_CYPRESS_default = {
  instantDelays: false,
};
export const PYTCH_CYPRESS = () => {
  if ((window as any)["PYTCH_CYPRESS"] == null) {
    (window as any)["PYTCH_CYPRESS"] = PYTCH_CYPRESS_default;
  }
  return (window as any)["PYTCH_CYPRESS"];
};

export function getPropertyByPath(target: any, pathStr: string) {
  const path = pathStr.split(".");
  return path.reduce((acc, cur) => acc[cur] ?? {}, target);
}
