import { Action, action, computed, Computed, Thunk, thunk } from "easy-peasy";
import { ProjectId } from "./projects";
import { failIfNull, getPropertyByPath } from "../utils";
import {
  ICreateProjectInteraction,
  createProjectInteraction,
} from "./user-interactions/create-project";
import {
  IAddAssetsInteraction,
  addAssetsInteraction,
} from "./user-interactions/add-assets";
import {
  IRenameAssetInteraction,
  renameAssetInteraction,
} from "./user-interactions/rename-asset";
import {
  IDisplayScreenshotInteraction,
  displayScreenshotInteraction,
} from "./user-interactions/display-screenshot";
import {
  IDownloadZipfileInteraction,
  downloadZipfileInteraction,
} from "./user-interactions/download-zipfile";
import {
  IUploadZipfileInteraction,
  uploadZipfileInteraction,
} from "./user-interactions/upload-zipfile";
import { IHelpSidebar, helpSidebar } from "./help-sidebar";

import { stageWidth, stageHeight } from "../constants";

/** Choices the user has made about how the IDE should be laid out.
 * Currently this is just a choice between two layouts, but in due
 * course it might include a draggable splitter between panes. */

export type IDELayoutKind = "wide-info-pane" | "tall-code-editor";

export interface IStageDisplaySize {
  width: number;
  height: number;
}

export interface IStageVerticalResizeState {
  dragStartY: number;
  dragStartHeight: number;
}

const buttonTourProgressStages = ["green-flag"] as const;
type ButtonTourStage = typeof buttonTourProgressStages[number];

export interface IIDELayout {
  kind: IDELayoutKind;
  stageDisplaySize: IStageDisplaySize;
  stageVerticalResizeState: IStageVerticalResizeState | null;
  buttonTourProgressIndex: number;
  buttonTourProgressStage: Computed<IIDELayout, ButtonTourStage | null>;
  helpSidebar: IHelpSidebar;
  setKind: Action<IIDELayout, IDELayoutKind>;
  setStageDisplayWidth: Action<IIDELayout, number>;
  setStageDisplayHeight: Action<IIDELayout, number>;
  initiateVerticalResize: Action<IIDELayout, number>;
  completeVerticalResize: Action<IIDELayout>;
  dismissButtonTour: Action<IIDELayout>;
  initiateButtonTour: Action<IIDELayout>;
  maybeAdvanceTour: Action<IIDELayout, ButtonTourStage>;
}

export const ideLayout: IIDELayout = {
  kind: "wide-info-pane",
  setKind: action((state, kind) => {
    if (state.kind === kind) {
      state.stageDisplaySize = { width: stageWidth, height: stageHeight };
    }
    state.kind = kind;
  }),

  stageDisplaySize: { width: stageWidth, height: stageHeight },
  setStageDisplayWidth: action((state, width) => {
    const height = Math.round(stageHeight * (width / stageWidth));
    state.stageDisplaySize = { width, height };
  }),
  setStageDisplayHeight: action((state, height) => {
    const width = Math.round(stageWidth * (height / stageHeight));
    state.stageDisplaySize = { width, height };
  }),

  stageVerticalResizeState: null,
  initiateVerticalResize: action((state, dragStartY) => {
    state.stageVerticalResizeState = {
      dragStartY,
      dragStartHeight: state.stageDisplaySize.height,
    };
  }),
  completeVerticalResize: action((state) => {
    state.stageVerticalResizeState = null;
  }),

  buttonTourProgressIndex: -1,
  buttonTourProgressStage: computed((state) => {
    const index = state.buttonTourProgressIndex;
    return index === -1 ? null : buttonTourProgressStages[index];
  }),
  dismissButtonTour: action((state) => {
    state.buttonTourProgressIndex = -1;
  }),
  initiateButtonTour: action((state) => {
    state.buttonTourProgressIndex = 0;
  }),
  maybeAdvanceTour: action((state, stageCompleted) => {
    if (state.buttonTourProgressStage === stageCompleted) {
      state.buttonTourProgressIndex += 1;
      if (state.buttonTourProgressIndex === buttonTourProgressStages.length) {
        state.buttonTourProgressIndex = -1;
      }
    }
  }),

  helpSidebar,
};

/** General modal dialog support. */

type IsShowingByName = Map<string, boolean>;

export interface IModals {
  isShowing: IsShowingByName;
  show: Action<IModals, string>;
  hide: Action<IModals, string>;
}

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

  createProjectInteraction: ICreateProjectInteraction;
  addAssetsInteraction: IAddAssetsInteraction;
  renameAssetInteraction: IRenameAssetInteraction;
  displayScreenshotInteraction: IDisplayScreenshotInteraction;
  downloadZipfileInteraction: IDownloadZipfileInteraction;
  uploadZipfileInteraction: IUploadZipfileInteraction;
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
    const dangerousActionConfirmation = failIfNull(
      state.dangerousActionConfirmation,
      "can't mark null dangerous-action-confirmation in progress"
    );
    dangerousActionConfirmation.progress =
      DangerousActionProgress.AwaitingActionCompletion;
  }),
  invokeDangerousAction: thunk(async (actions, payload, helpers) => {
    const state = helpers.getState();
    const dangerousActionConfirmation = failIfNull(
      state.dangerousActionConfirmation,
      "can't invoke null dangerous-action-confirmation"
    );

    actions.markDangerousActionInProgress();

    const actionDescriptor =
      dangerousActionConfirmation.descriptor.actionIfConfirmed;

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

  createProjectInteraction,
  addAssetsInteraction,
  renameAssetInteraction,
  displayScreenshotInteraction,
  downloadZipfileInteraction,
  uploadZipfileInteraction,
};

export interface IPlainTextPane {
  text: string;
  append: Action<IPlainTextPane, string>;
  appendTimestamped: Action<IPlainTextPane, string>;
  clear: Action<IPlainTextPane>;
}

const makeTextPane = (): IPlainTextPane => ({
  text: "",
  append: action((state, chunk) => {
    state.text += chunk;
  }),
  appendTimestamped: action((state, lineContent) => {
    const now = new Date(Date.now());
    state.text += `${now.toISOString()} : ${lineContent}\n`;
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
