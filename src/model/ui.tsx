import { Action, action, Thunk, thunk } from "easy-peasy";
import { ProjectId } from "./projects";
import { IPytchAppModel } from ".";

type IsShowingByName = Map<string, boolean>;

export interface IModals {
  isShowing: IsShowingByName;
  show: Action<IModals, string>;
  hide: Action<IModals, string>;
}

export const modals: IModals = {
  isShowing: new Map<string, boolean>([
    ["create-project", false],
    ["add-asset", false],
    ["confirm-project-delete", false],
  ]),
  show: action((state, modalName) => {
    state.isShowing.set(modalName, true);
  }),
  hide: action((state, modalName) => {
    state.isShowing.set(modalName, false);
  }),
};

export interface IConfirmProjectDelete {
  id: ProjectId;
  name: string;
}

/** What stage are we at in performing a "dangerous" action (one
 * requiring confirmation by the user before actually doing it)? */
enum DangerousActionProgress {
  AwaitingUserChoice,
  AwaitingActionCompletion,
}

/** Description of an action to dispatch when the time is right. */
export interface IDeferredAction {
  typePath: string;
  payload: any;
}

/** Description of the "delete project" dangerous action. */
export interface IDeleteProjectDescriptor {
  kind: "delete-project";
  projectName: string;
  actionIfConfirmed: IDeferredAction;
}

/** TEMPORARY: In due course will be a union over types representing
 * other dangerous actions.  Can we avoid having to repeat
 * actionIfConfirmed in each one? */
export type IDangerousActionDescriptor = IDeleteProjectDescriptor;

/** What dangerous action are we asking the user to confirm? */
export interface IDangerousActionConfirmation {
  progress: DangerousActionProgress;
  descriptor: IDangerousActionDescriptor;
}

export interface IUserConfirmations {
  projectToDelete: IConfirmProjectDelete | null;
  setProjectToDelete: Action<IUserConfirmations, IConfirmProjectDelete>;
  deleteProject: Thunk<
    IUserConfirmations,
    IConfirmProjectDelete,
    {},
    IPytchAppModel
  >;

  dangerousActionConfirmation: IDangerousActionConfirmation | null;
  requestDangerousActionConfirmation: Action<
    IUserConfirmations,
    IDangerousActionDescriptor
  >;
  markDangerousActionInProgress: Action<IUserConfirmations>;
}

export const userConfirmations: IUserConfirmations = {
  projectToDelete: null,
  setProjectToDelete: action((state, payload) => {
    state.projectToDelete = payload;
  }),
  deleteProject: thunk((actions, project, helpers) => {
    actions.setProjectToDelete(project);
    const storeActions = helpers.getStoreActions();
    storeActions.modals.show("confirm-project-delete");
  }),

  dangerousActionConfirmation: null,
  requestDangerousActionConfirmation: action((state, descriptor) => {
    state.dangerousActionConfirmation = {
      progress: DangerousActionProgress.AwaitingUserChoice,
      descriptor,
    };
  }),
  markDangerousActionInProgress: action((state) => {
    if (state.dangerousActionConfirmation == null) {
      throw Error("can't mark null dangerous-action-confirmation in progress");
    }
    state.dangerousActionConfirmation.progress =
      DangerousActionProgress.AwaitingActionCompletion;
  }),
};

export interface IStandardOutputPane {
  text: string;
  append: Action<IStandardOutputPane, string>;
  clear: Action<IStandardOutputPane>;
}

export const standardOutputPane: IStandardOutputPane = {
  text: "",
  append: action((state, chunk) => {
    state.text += chunk;
  }),
  clear: action((state) => {
    state.text = "";
  }),
};

// TODO: Does this interface belong somewhere else?
export interface IErrorReport {
  pytchError: any; // TODO
  errorContext: any; // TODO
}

export interface IErrorReportList {
  errors: Array<IErrorReport>;
  append: Action<IErrorReportList, IErrorReport>;
  clear: Action<IErrorReportList>;
}

export const errorReportList: IErrorReportList = {
  errors: [],
  append: action((state, errorReport) => {
    console.log("appending error", errorReport);
    state.errors.push(errorReport);
  }),
  clear: action((state) => {
    state.errors.splice(0);
  }),
};

export interface IInfoPanel {
  activeTabKey: string;
  setActiveTabKey: Action<IInfoPanel, string>;
}

export const infoPanel: IInfoPanel = {
  activeTabKey: "assets",
  setActiveTabKey: action((state, key) => {
    state.activeTabKey = key;
  }),
};
