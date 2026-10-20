import common from "../data/i18n-by-ns/en/common.json";
import assets from "../data/i18n-by-ns/en/assets.json";
import demos from "../data/i18n-by-ns/en/demos.json";
import errors from "../data/i18n-by-ns/en/errors.json";
import flows from "../data/i18n-by-ns/en/flows.json";
import ide from "../data/i18n-by-ns/en/ide.json";
import notableChanges from "../data/i18n-by-ns/en/notable-changes.json";
import projects from "../data/i18n-by-ns/en/projects.json";
import tutorials from "../data/i18n-by-ns/en/tutorials.json";
import vm from "../data/i18n-by-ns/en/vm.json";
import welcome from "../data/i18n-by-ns/en/welcome.json";

export const resources = {
  common,
  assets,
  demos,
  errors,
  flows,
  ide,
  "notable-changes": notableChanges,
  projects,
  tutorials,
  vm,
  welcome,
} as const;
