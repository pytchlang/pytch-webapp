import { Action, action, computed, Computed, Thunk, thunk } from "easy-peasy";
import { ProjectId } from "./project-core";
import { failIfNull, getPropertyByPath } from "../utils";
import {
  ICreateProjectInteraction,
  createProjectInteraction,
} from "./user-interactions/create-project";
import { IProcessFilesInteraction } from "./user-interactions/process-files";
import { addAssetsInteraction } from "./user-interactions/add-assets";
import {
  IAddClipArtItemsInteraction,
  addClipArtItemsInteraction,
} from "./user-interactions/clipart-gallery-select";
import {
  IRenameAssetInteraction,
  renameAssetInteraction,
} from "./user-interactions/rename-asset";
import {
  IRenameProjectInteraction,
  renameProjectInteraction,
} from "./user-interactions/rename-project";
import {
  IDisplayScreenshotInteraction,
  displayScreenshotInteraction,
} from "./user-interactions/display-screenshot";
import {
  IDownloadZipfileInteraction,
  downloadZipfileInteraction,
} from "./user-interactions/download-zipfile";
import {
  ICopyProjectInteraction,
  copyProjectInteraction,
} from "./user-interactions/save-project-as";
import {
  ICodeDiffHelpInteraction,
  codeDiffHelpInteraction,
} from "./user-interactions/code-diff-help";
import {
  ICropScaleImageInteraction,
  cropScaleImageInteraction,
} from "./user-interactions/crop-scale-image";
import { uploadZipfilesInteraction } from "./user-interactions/upload-zipfiles";
import { IHelpSidebar, helpSidebar } from "./help-sidebar";

import { stageWidth, stageHeight, stageFullScreenBorderPx } from "../constants";

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

type FullScreenStateIsFullScreen = {
  isFullScreen: true;
  stageWidthInIDE: number;
  stageHeightInIDE: number;
};
type FullScreenState = { isFullScreen: false } | FullScreenStateIsFullScreen;

export interface IIDELayout {
  kind: IDELayoutKind;
  fullScreenState: FullScreenState;
  stageDisplaySize: IStageDisplaySize;
  stageVerticalResizeState: IStageVerticalResizeState | null;
  buttonTourProgressIndex: number;
  buttonTourProgressStage: Computed<IIDELayout, ButtonTourStage | null>;
  helpSidebar: IHelpSidebar;
  setKind: Action<IIDELayout, IDELayoutKind>;
  setIsFullScreen: Action<IIDELayout, boolean>;
  ensureNotFullScreen: Thunk<IIDELayout>;
  resizeFullScreen: Action<IIDELayout>;
  setStageDisplayWidth: Action<IIDELayout, number>;
  setStageDisplayHeight: Action<IIDELayout, number>;
  initiateVerticalResize: Action<IIDELayout, number>;
  completeVerticalResize: Action<IIDELayout>;
  dismissButtonTour: Action<IIDELayout>;
  initiateButtonTour: Action<IIDELayout>;
  maybeAdvanceTour: Action<IIDELayout, ButtonTourStage>;
}

const fullScreenStageDisplaySize = () => {
  const { clientWidth, clientHeight } = document.documentElement;
  const maxStageWidth = clientWidth - 2 * stageFullScreenBorderPx;
  // TODO: "40" comes from an estimate of StageControls height; turn
  // this into a constant somewhere.
  const maxStageHeight = clientHeight - 40 - 2 * stageFullScreenBorderPx;

  const stretchWidth = maxStageWidth / stageWidth;
  const stretchHeight = maxStageHeight / stageHeight;

  if (stretchWidth > stretchHeight) {
    const clampedStageWidth = Math.round(stageWidth * stretchHeight);
    return {
      width: clampedStageWidth,
      height: maxStageHeight,
    };
  } else {
    const clampedStageHeight = Math.round(stageHeight * stretchWidth);
    return {
      width: maxStageWidth,
      height: clampedStageHeight,
    };
  }
};

export const ideLayout: IIDELayout = {
  kind: "wide-info-pane",
  fullScreenState: { isFullScreen: false },
  setKind: action((state, kind) => {
    if (state.kind === kind) {
      state.stageDisplaySize = { width: stageWidth, height: stageHeight };
    }
    state.kind = kind;
  }),
  setIsFullScreen: action((state, isFullScreen) => {
    if (isFullScreen === state.fullScreenState.isFullScreen) {
      console.warn(`trying to set isFullScreen ${isFullScreen} but is already`);
      return;
    }

    if (isFullScreen) {
      const stageSizeIDE = state.stageDisplaySize;
      state.stageDisplaySize = fullScreenStageDisplaySize();
      state.fullScreenState = {
        isFullScreen: true,
        stageWidthInIDE: stageSizeIDE.width,
        stageHeightInIDE: stageSizeIDE.height,
      };
    } else {
      // Switching to non-full-screen; must currently be in full-screen;
      // state.fullScreenInfo type must be FullScreenInfoFullScreen:
      const info = state.fullScreenState as FullScreenStateIsFullScreen;

      state.stageDisplaySize = {
        width: info.stageWidthInIDE,
        height: info.stageHeightInIDE,
      };
      state.fullScreenState = { isFullScreen: false };
    }
  }),
  ensureNotFullScreen: thunk((actions, _voidPayload, helpers) => {
    if (helpers.getState().fullScreenState.isFullScreen) {
      actions.setIsFullScreen(false);
      // Currently, the only reason this thunk is called is if an error
      // happens while in full-screen layout.  In that situation, it's
      // more useful to switch the IDE to "wide-info-pane" layout, so
      // the error message pane is visible.
      actions.setKind("wide-info-pane");
    }
  }),
  resizeFullScreen: action((state) => {
    state.stageDisplaySize = fullScreenStageDisplaySize();
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

export interface IDeleteManyProjectsDescriptor {
  kind: "delete-many-projects";
  projectIds: Array<ProjectId>;
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
  | IDeleteManyProjectsDescriptor
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
  addAssetsInteraction: IProcessFilesInteraction;
  addClipArtItemsInteraction: IAddClipArtItemsInteraction;
  renameAssetInteraction: IRenameAssetInteraction;
  renameProjectInteraction: IRenameProjectInteraction;
  displayScreenshotInteraction: IDisplayScreenshotInteraction;
  downloadZipfileInteraction: IDownloadZipfileInteraction;
  copyProjectInteraction: ICopyProjectInteraction;
  uploadZipfilesInteraction: IProcessFilesInteraction;
  codeDiffHelpInteraction: ICodeDiffHelpInteraction;
  cropScaleImageInteraction: ICropScaleImageInteraction;
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
  addClipArtItemsInteraction,
  renameAssetInteraction,
  renameProjectInteraction,
  displayScreenshotInteraction,
  downloadZipfileInteraction,
  copyProjectInteraction,
  uploadZipfilesInteraction,
  codeDiffHelpInteraction,
  cropScaleImageInteraction,
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
