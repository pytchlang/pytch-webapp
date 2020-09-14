export const withinApp = (url: string) => {
  return url[0] === "/" ? process.env.PUBLIC_URL + url : url;
};

// For ad-hoc UI testing:
export const delaySeconds = (seconds: number) =>
  new Promise((r) => setTimeout(r, 1000.0 * seconds));
