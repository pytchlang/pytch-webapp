type ApiBootStatus =
  | { kind: "not-yet-started" }
  | { kind: "pending" }
  | { kind: "succeeded"; api: GoogleDriveApi }
  | { kind: "failed" };

export type GoogleDriveIntegration = {
};

export let googleDriveIntegration: GoogleDriveIntegration = {
};
