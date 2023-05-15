const loadGapiClient = (gapi: any, libraries: string): Promise<void> =>
  new Promise((resolve, reject) => {
    gapi.load(libraries, {
      callback: () => resolve(),
      onerror: () => reject(new Error("Failed to load gapi library")),
    });
  });
