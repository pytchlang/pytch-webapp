import { AsyncFile } from "./shared";

type CallBehaviour = {
  boot: "ok" | "fail" | "stall";
  acquireToken: "ok" | "wait" | "fail";
  exportFile: "ok" | "fail";
  importFiles:
    | { kind: "fail"; message: string }
    | { kind: "ok"; files: Array<AsyncFile> };
};
