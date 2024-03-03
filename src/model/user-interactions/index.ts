import { Action, action, Computed, computed, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel, PytchAppModelActions } from "..";
import { delaySeconds } from "../../utils";

/*

Model component representing progress through a modal user interaction.

A user interaction needs to define:

* An interface (or type) containing the properties/actions specific to
  that user interaction.  For example, for the user interaction of
  creating a new project, the pieces of state are the to-be-created
  project's name, and the template used for its creation.  By default,
  the flow includes a pulsed "success" message, but this can be
  suppressed by having a constant `_pulseSuccessMessage` equal to
  `false` in the interaction-specific type and value.  See
  `IUpsertHatBlockSpecific` for an example.

* An "attempt the task" function, which should try to do the operation
  the user has requested, for example create a new project, based on a
  "descriptor" (see next bullet) which is passed to it.  This is allowed
  to throw an exception; if so, the user interaction goes to state
  "failed".

* A type which encapsulates the data required to perform the task; this
  is the TaskDescriptor type parameter.  In the create-project example,
  this consists of the name and template-kind.

These three things are used with the templated type and function in this
file in a slightly complicated dance.  The example in create-project.ts
hopefully gives the idea.

Then on the user-facing side, you also need:

* A React component which displays the current state of the interaction,
  and allows the user to supply the required information, storing it in
  the model-slice state via the model-slice actions.  In the
  create-project example, this is <CreateProjectModal>.

* A button or similar to launch the modal dialog, by calling the
  specific interaction's launch() action.  In the create-project
  example, there is a button which is part of the internal project list
  component <ProjectListButtons>.


Things that are not perfect about this approach / implementation:

* It would be good to have a better way of knowing when the inputs are
  ready.  (E.g., for creating a project, "inputs ready" means "there is
  a non-empty name".)

* If the user is in "My Projects", launches the "create project" modal,
  and then clicks the browser back button, the app goes back to the
  Pytch front page, but the modal remains.

* There is duplication between, e.g., the ICreateProjectDescriptor and
  the ICreateProjectSpecific types.  Could the ICreateProjectSpecific
  type be expressed as "ICreateProjectDescriptor & { setName: ...;
  setTemplate: ...; ... }"?  In general the descriptor might not have
  this simple relationship with the model slice, but maybe there is some
  improvement to be made here.

*/

export type InteractionProgress =
  | { status: "not-happening" }
  | { status: "not-tried-yet" }
  | { status: "trying" }
  | { status: "succeeded" }
  | { status: "failed"; message: string };

export interface IModalUserInteraction<TaskDescriptor> {
  _pulseSuccessMessage: boolean;

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
    void,
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
  actions: PytchAppModelActions,
  descriptor: Descriptor
) => Promise<void>;

export function modalUserInteraction<TaskDescriptor, SpecificModel>(
  attemptAction: AttemptActionFunction<TaskDescriptor>,
  specificModel: SpecificModel
): IModalUserInteraction<TaskDescriptor> & SpecificModel {
  const baseModel: IModalUserInteraction<TaskDescriptor> = {
    _pulseSuccessMessage: true,

    progress: { status: "not-happening" },
    inputsReady: false,

    isActive: computed((state) => state.progress.status !== "not-happening"),
    isInteractable: computed((state) => {
      const status = state.progress.status;
      return status === "not-tried-yet" || status === "failed";
    }),
    attemptSucceeded: computed(
      (state) => state.progress.status === "succeeded"
    ),
    maybeLastFailureMessage: computed((state) =>
      state.progress.status === "failed" ? state.progress.message : null
    ),

    superLaunch: thunk((actions) => {
      actions.setProgress({ status: "not-tried-yet" });
      actions.setInputsReady(false);
    }),
    dismiss: thunk((actions) =>
      actions.setProgress({ status: "not-happening" })
    ),
    attempt: thunk(async (actions, actionDescriptor, helpers) => {
      try {
        actions.setProgress({ status: "trying" });
        await attemptAction(helpers.getStoreActions(), actionDescriptor);
        if (combinedModel._pulseSuccessMessage) {
          actions.setProgress({ status: "succeeded" });
          await delaySeconds(0.8);
        }
        actions.setProgress({ status: "not-happening" });
      } catch (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        err: any
      ) {
        actions.setProgress({ status: "failed", message: err.message });
      }
    }),

    setProgress: action((state, newProgress) => {
      state.progress = newProgress;
    }),
    setInputsReady: action((state, inputsReady) => {
      state.inputsReady = inputsReady;
    }),
  };

  let combinedModel = Object.assign({}, baseModel, specificModel);
  return combinedModel;
}

/** A no-op function suitable for use as the "attempt" function of a
 * user interaction. */
export async function doNothing<T>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _actions: PytchAppModelActions,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _descriptor: T
) {
  /* Do nothing. */
}
