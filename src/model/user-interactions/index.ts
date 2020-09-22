import {
  Action,
  action,
  Actions,
  Computed,
  computed,
  Thunk,
  thunk,
} from "easy-peasy";
import { IPytchAppModel } from "..";

export type InteractionProgress =
  | { status: "not-happening" }
  | { status: "not-tried-yet" }
  | { status: "trying" }
  | { status: "succeeded" }
  | { status: "failed"; message: string };

export interface IModalUserInteraction<TaskDescriptor> {
  progress: InteractionProgress;
  inputsReady: boolean;

  isActive: Computed<IModalUserInteraction<TaskDescriptor>, boolean>;
  isInteractable: Computed<IModalUserInteraction<TaskDescriptor>, boolean>;
  attemptSucceeded: Computed<IModalUserInteraction<TaskDescriptor>, boolean>;
  maybeLastFailureMessage: Computed<
    IModalUserInteraction<TaskDescriptor>,
    string | null
  >;

  dismiss: Thunk<IModalUserInteraction<TaskDescriptor>>;
  attempt: Thunk<
    IModalUserInteraction<TaskDescriptor>,
    TaskDescriptor,
    any,
    IPytchAppModel
  >;

  setProgress: Action<
    IModalUserInteraction<TaskDescriptor>,
    InteractionProgress
  >;
  setInputsReady: Action<IModalUserInteraction<TaskDescriptor>, boolean>;
  superLaunch: Thunk<IModalUserInteraction<TaskDescriptor>>;
}

type AttemptActionFunction<Descriptor> = (
  actions: Actions<IPytchAppModel>,
  descriptor: Descriptor
) => Promise<void>;
