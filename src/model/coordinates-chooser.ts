type StateKind = "idle" | "active" | "active-with-copied-message";

type State = {
  seqnum: number;
  kind: StateKind;
};
