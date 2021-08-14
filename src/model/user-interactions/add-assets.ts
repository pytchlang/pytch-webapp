export type Failure = {
  fileName: string;
  reason: string;
};

type ScalarState =
  | { status: "idle" }
  | { status: "awaiting-user-choice" }
  | { status: "trying-to-add" };

type ScalarStatus = ScalarState["status"];

type State =
  | ScalarState
  | { status: "showing-failures"; failures: Array<Failure> };
