import { envVarOrFail } from "../../env-utils";
import { mockBootApi } from "./mock";
import { realBootApi } from "./real";
import { GoogleDriveBootApi } from "./shared";

export { type AsyncFile, type TokenInfo } from "./shared";

export const bootApi = (): GoogleDriveBootApi => {
  // TODO: Document VITE_USE_REAL_GOOGLE_DRIVE env.var.  Set in launch
  // script?  How to override for running Cypress tests?  How to skip
  // the Google drive tests when running against deployment zipfile via
  // Docker?
  //
  // Currently seeing what DX is like if we set it in the .env file.
  //
  return envVarOrFail("VITE_USE_REAL_GOOGLE_DRIVE") === "yes"
    ? realBootApi
    : mockBootApi;
};
