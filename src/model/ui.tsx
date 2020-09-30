import { Action, action, Thunk, thunk } from "easy-peasy";
import { ProjectId } from "./projects";
import { getPropertyByPath } from "../utils";
import {
  IAddAssetInteraction,
  addAssetInteraction,
} from "./user-interactions/add-asset";
import {
  IRenameAssetInteraction,
  renameAssetInteraction,
} from "./user-interactions/rename-asset";

type IsShowingByName = Map<string, boolean>;

export interface IModals {
  isShowing: IsShowingByName;
  show: Action<IModals, string>;
  hide: Action<IModals, string>;
}

/**
 * Modal dialogs.
 *
 * (Modals for "please confirm you would really like to do this
 * dangerous action" are handled separately: ConfirmDangerousActionModal
 * component and dangerousActionConfirmation model slot.)
 */
export const modals: IModals = {
  isShowing: new Map<string, boolean>([["create-project", false]]),
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
export enum DangerousActionProgress {
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
}

// TODO: Replace assetKind as string with enum AssetKind from
// asset-server.ts once that file re-organised.
export interface IDeleteAssetFromProjectDescriptor {
  kind: "delete-project-asset";
  assetKind: string;
  assetName: string;
}

export type IDangerousActionDescriptor = (
  | IDeleteProjectDescriptor
  | IDeleteAssetFromProjectDescriptor
) & { actionIfConfirmed: IDeferredAction };

/** What dangerous action are we asking the user to confirm? */
export interface IDangerousActionConfirmation {
  progress: DangerousActionProgress;
  descriptor: IDangerousActionDescriptor;
}

export interface IUserConfirmations {
  dangerousActionConfirmation: IDangerousActionConfirmation | null;
  requestDangerousActionConfirmation: Action<
    IUserConfirmations,
    IDangerousActionDescriptor
  >;
  markDangerousActionInProgress: Action<IUserConfirmations>;
  invokeDangerousAction: Thunk<IUserConfirmations>;
  dismissDangerousAction: Action<IUserConfirmations>;

  addAssetInteraction: IAddAssetInteraction;
  renameAssetInteraction: IRenameAssetInteraction;
}

// TODO: Better name than 'confirmations'.
//
export const userConfirmations: IUserConfirmations = {
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
  invokeDangerousAction: thunk(async (actions, payload, helpers) => {
    const state = helpers.getState();
    if (state.dangerousActionConfirmation == null) {
      throw Error("can't mark null dangerous-action-confirmation in progress");
    }

    actions.markDangerousActionInProgress();

    const actionDescriptor =
      state.dangerousActionConfirmation.descriptor.actionIfConfirmed;

    const actionFunction = getPropertyByPath(
      helpers.getStoreActions(),
      actionDescriptor.typePath
    );
    const actionResult = await actionFunction(actionDescriptor.payload);
    actions.dismissDangerousAction();
    return actionResult;
  }),
  dismissDangerousAction: action((state) => {
    state.dangerousActionConfirmation = null;
  }),

  addAssetInteraction,
  renameAssetInteraction,
};

export interface IStandardOutputPane {
  text: string;
  append: Action<IStandardOutputPane, string>;
  clear: Action<IStandardOutputPane>;
}

const makeTextPane = (): IStandardOutputPane => ({
  text: "",
  append: action((state, chunk) => {
    state.text += chunk;
  }),
  clear: action((state) => {
    state.text = "";
  }),
});

export const standardOutputPane = makeTextPane();
export const editorWebSocketLog = makeTextPane();

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
