export const withinApp = (url: string) => {
  return url[0] === "/" ? process.env.PUBLIC_URL + url : url;
};
