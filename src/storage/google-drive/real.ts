const loadGapiClient = (gapi: any, libraries: string): Promise<void> =>
  new Promise((resolve, reject) => {
    gapi.load(libraries, {
      callback: () => resolve(),
      onerror: () => reject(new Error("Failed to load gapi library")),
    });
  });

const realApi = (google: any, tokenClient: any): GoogleDriveApi => {
  function acquireToken(options: AcquireTokenOptions): Promise<TokenInfo> {
    const { signal } = options;

    return new Promise<TokenInfo>((resolve, reject) => {
      const doUserCancel = () => reject(new Error(signal.reason));
      signal.addEventListener("abort", doUserCancel, { once: true });

      tokenClient.callback = (response: any) => {
        const maybeError = response.error;
        if (maybeError !== undefined) {
          console.error("tokenClient.callback(): error:", response);
          if (signal.aborted) {
            console.log("already abort()'d with", signal.reason);
          } else {
            signal.removeEventListener("abort", doUserCancel);
            reject(
              new Error(`Could not log in to Google (code "${maybeError}")`)
            );
          }
        } else {
          console.log("tokenClient.callback(): non-error:", response);
          if (signal.aborted) {
            console.log("already abort()'d with", signal.reason);
          } else {
            // TODO: Also get user info?
            signal.removeEventListener("abort", doUserCancel);
            resolve({
              token: response.access_token,
              expiration: new Date(), // TODO: Get from response.expires_in
            });
          }
        }
      };

      // Empty prompt means "The user will be prompted only the first
      // time your app requests access".
      tokenClient.requestAccessToken({ prompt: "" });
    });
  }
};
