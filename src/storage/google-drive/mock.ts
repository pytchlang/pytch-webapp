import { AsyncFile } from "./shared";
import { delaySeconds } from "../../utils";

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
