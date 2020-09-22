export type InteractionProgress =
  | { status: "not-happening" }
  | { status: "not-tried-yet" }
  | { status: "trying" }
  | { status: "succeeded" }
  | { status: "failed"; message: string };
