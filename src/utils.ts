export const withinApp = (url: string) => {
  return url[0] === "/" ? process.env.PUBLIC_URL + url : url;
};

// For ad-hoc UI testing:
export const delaySeconds = (seconds: number) =>
  new Promise((r) => setTimeout(r, 1000.0 * seconds));

// For testing hooks:
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
