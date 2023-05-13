import { AsyncFile, GoogleDriveApi, GoogleDriveBootApi } from "./shared";
import { assertNever, delaySeconds } from "../../utils";

type CallBehaviour = {
  boot: "ok" | "fail" | "stall";
  acquireToken: "ok" | "wait" | "fail";
  exportFile: "ok" | "fail";
  importFiles:
    | { kind: "fail"; message: string }
    | { kind: "ok"; files: Array<AsyncFile> };
};

export type MockApiBehaviour = {
  [Prop in keyof CallBehaviour]: Array<CallBehaviour[Prop]>;
};

const mockBehaviourSpec = async (): Promise<MockApiBehaviour> => {
  let spec = null;

  while (spec == null) {
    spec = (window as any).$GoogleDriveApiBehaviour;
    await delaySeconds(0.2);
  }

  return spec as MockApiBehaviour;
};

function shiftBehaviourOrFail<Prop extends keyof CallBehaviour>(
  spec: MockApiBehaviour,
  prop: Prop
): CallBehaviour[Prop] {
  const behaviour = spec[prop].shift();
  if (behaviour === undefined) {
    throw new Error(`internal error; not enough ${prop} behaviours in spec`);
  }
  return behaviour;
}

function mockApi(spec: MockApiBehaviour): GoogleDriveApi {
  const acquireToken: GoogleDriveApi["acquireToken"] = async ({ signal }) => {
    const behaviour = shiftBehaviourOrFail(spec, "acquireToken");
    switch (behaviour) {
      case "ok":
        return { token: "access-granted", expiration: new Date() };
      case "wait": {
        return await new Promise((_resolve, reject) => {
          const doUserCancel = () =>
            reject(new Error("User cancelled login operation"));
          signal.addEventListener("abort", doUserCancel, { once: true });
        });
      }
      case "fail":
        throw new Error(
          "Could not log in to Google account" +
            ` (technical details: "something_went_wrong")`
        );
      default:
        return assertNever(behaviour);
    }
  };

  const importFiles: GoogleDriveApi["importFiles"] = async (_tokInfo) => {
    const behaviour = shiftBehaviourOrFail(spec, "importFiles");
    switch (behaviour.kind) {
      case "fail":
        throw new Error(behaviour.message);
      case "ok":
        return behaviour.files;
      default:
        return assertNever(behaviour);
    }
  };
}

export const mockBootApi: GoogleDriveBootApi = {
};
