import { Action, action, computed, Computed, Thunk, thunk } from "easy-peasy";
import {
  CreateProjectFlow,
  createProjectFlow,
} from "./user-interactions/create-project";
import { AddAssetsFlow, addAssetsFlow } from "./user-interactions/add-assets";
import {
  AddClipArtFlow,
  addClipArtFlow,
} from "./user-interactions/clipart-gallery-select";
import {
  renameAssetFlow,
  RenameAssetFlow,
} from "./user-interactions/rename-asset";
import {
  RenameProjectFlow,
  renameProjectFlow,
} from "./user-interactions/rename-project";
import {
  DisplayScreenshotFlow,
  displayScreenshotFlow,
} from "./user-interactions/display-screenshot";
import {
  DownloadZipfileFlow,
  downloadZipfileFlow,
} from "./user-interactions/download-zipfile";
import {
  SaveProjectAsFlow,
  saveProjectAsFlow,
} from "./user-interactions/save-project-as";
import {
  CodeDiffHelpFlow,
  codeDiffHelpFlow,
} from "./user-interactions/code-diff-help";
import {
  CropScaleImageFlow,
  cropScaleImageFlow,
} from "./user-interactions/crop-scale-image";
import {
  ShareTutorialFlow,
  shareTutorialFlow,
} from "./user-interactions/share-tutorial";
import {
  ViewCodeDiffFlow,
  viewCodeDiffFlow,
} from "./user-interactions/view-code-diff";

import {
  UploadZipfilesFlow,
  uploadZipfilesFlow,
} from "./user-interactions/upload-zipfiles";
import { IHelpSidebar, helpSidebar } from "./help-sidebar";

import {
  stageWidth,
  stageHeight,
  stageFullScreenBorderPx,
  stageHalfWidth,
  stageHalfHeight,
  defaultCodeEditorFontSize,
} from "../constants";
import { coordsChooser, CoordsChooser } from "./coordinates-chooser";
import {
  deleteAssetFlow,
  DeleteAssetFlow,
} from "./user-interactions/delete-asset";
import {
  deleteProjectFlow,
  DeleteProjectFlow,
} from "./user-interactions/delete-project";
import {
  DeleteManyProjectsFlow,
  deleteManyProjectsFlow,
} from "./user-interactions/delete-many-projects";
import {
  KeyboardShortcutsHelpContent,
  keyboardShortcutsHelpContent,
} from "./keyboard-shortcuts-help";
import {
  StartTutorialAtCheckpointFlow,
  startTutorialAtCheckpointFlow,
} from "./user-interactions/start-tutorial-at-checkpoint";
import { demoSidebar, IDemoSidebar } from "./demo-sidebar";
import {
  CreateProjectFromDemoFlow,
  createProjectFromDemoFlow,
} from "./project-from-demo-flow";
import { ActivityBarTabKey } from "./junior/edit-state";

export interface IStageDisplaySize {
  width: number;
  height: number;
}

export const eqDisplaySize = (
  ds1: IStageDisplaySize,
  ds2: IStageDisplaySize
): boolean => ds1.width === ds2.width && ds1.height === ds2.height;

const buttonTourProgressStages = ["green-flag"] as const;
type ButtonTourStage = (typeof buttonTourProgressStages)[number];

type FullScreenStateIsFullScreen = {
  isFullScreen: true;
  stageWidthInIDE: number;
  stageHeightInIDE: number;
};
type FullScreenState = { isFullScreen: false } | FullScreenStateIsFullScreen;

type StagePosition = { stageX: number; stageY: number };
export type PointerStagePosition =
  | { kind: "not-over-stage" }
  | ({ kind: "over-stage" } & StagePosition);

type UpdatePointerOverStageArgs = {
  canvas: HTMLCanvasElement | null;
  displaySize: IStageDisplaySize;
  mousePosition: { clientX: number; clientY: number } | null;
};

export type LayoutStyle = "split-screen" | "single-screen-vertical";

export type HelpSidebarOrientation = "vertical" | "horizontal";

export interface IIDELayout {
  fullScreenState: FullScreenState;
  pointerStagePosition: PointerStagePosition;
  coordsChooser: CoordsChooser;
  stageDisplaySize: IStageDisplaySize;
  buttonTourProgressIndex: number;
  buttonTourProgressStage: Computed<IIDELayout, ButtonTourStage | null>;
  helpSidebar: IHelpSidebar;
  demoSidebar: IDemoSidebar;
  keyboardShortcutsHelpContent: KeyboardShortcutsHelpContent;
  codeEditorFontSize: number;
  layoutStyle: LayoutStyle;
  tabs: Array<ActivityBarTabKey>;
  helpSidebarOrientation: HelpSidebarOrientation;
  resizablePanelsGroupRef: HTMLDivElement | null;
  _setIsFullScreen: Action<IIDELayout, boolean>;
  setIsFullScreen: Thunk<IIDELayout, boolean>;
  ensureNotFullScreen: Thunk<IIDELayout>;
  resizeFullScreen: Action<IIDELayout>;
  setPointerNotOverStage: Action<IIDELayout>;
  setPointerOverStage: Action<IIDELayout, StagePosition>;
  updatePointerStagePosition: Thunk<IIDELayout, UpdatePointerOverStageArgs>;
  setStageDisplayWidth: Action<IIDELayout, number>;
  setStageDisplayHeight: Action<IIDELayout, number>;
  dismissButtonTour: Action<IIDELayout>;
  initiateButtonTour: Action<IIDELayout>;
  maybeAdvanceTour: Action<IIDELayout, ButtonTourStage>;
  setCodeEditorFontSize: Action<IIDELayout, number>;
  setLayoutStyle: Action<IIDELayout, LayoutStyle>;
  setHelpSidebarOrientation: Action<IIDELayout, HelpSidebarOrientation>;
  setTabs: Action<IIDELayout, Array<ActivityBarTabKey>>;
  setResizablePanelsGroupRef: Action<IIDELayout, HTMLDivElement | null>;
}

export const fullScreenStageDisplaySize = (controlsHeight = 36) => {
  const { clientWidth, clientHeight } = document.documentElement;
  const maxStageWidth = clientWidth - 2 * stageFullScreenBorderPx;

  // The "8" is the margin between controls and stage; ideally this
  // would be fetched from somewhere, as would the default value of the
  // "controlsHeight" arg.
  const maxStageHeight =
    clientHeight - controlsHeight - 8 - 2 * stageFullScreenBorderPx;

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
  fullScreenState: { isFullScreen: false },
  pointerStagePosition: { kind: "not-over-stage" },
  coordsChooser,
  _setIsFullScreen: action((state, isFullScreen) => {
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
  setIsFullScreen: thunk((actions, isFullScreen) => {
    actions._setIsFullScreen(isFullScreen);
    // If we're moving from full-screen to non-full-screen, the
    // coords-chooser should be idle anyway, but no harm to set it in
    // this case.
    actions.coordsChooser.setStateKind("idle");
  }),
  ensureNotFullScreen: thunk((actions, _voidPayload, helpers) => {
    if (helpers.getState().fullScreenState.isFullScreen) {
      actions.setIsFullScreen(false);
    }
  }),
  resizeFullScreen: action((state) => {
    state.stageDisplaySize = fullScreenStageDisplaySize();
  }),

  setPointerNotOverStage: action((state) => {
    state.pointerStagePosition = { kind: "not-over-stage" };
  }),
  setPointerOverStage: action((state, position) => {
    state.pointerStagePosition = { kind: "over-stage", ...position };
  }),
  updatePointerStagePosition: thunk(
    (actions, { canvas, displaySize, mousePosition }) => {
      if (canvas == null) {
        return;
      }
      if (mousePosition == null) {
        actions.setPointerNotOverStage();
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const stageLeft = rect.left + 1; // Allow for border.
      const stageTop = rect.top + 1; // Allow for border.

      const rawStageX =
        (stageWidth * (mousePosition.clientX - stageLeft)) / displaySize.width -
        stageHalfWidth;

      // Negate to convert from browser coord system of "down is
      // positive Y" to Scratch-like mathematical coord system of
      // "up is positive Y":
      const rawStageY =
        stageHalfHeight -
        (stageHeight * (mousePosition.clientY - stageTop)) / displaySize.height;

      // Present integers to the user:
      const stageX = Math.round(rawStageX);
      const stageY = Math.round(rawStageY);

      if (
        stageX < -stageHalfWidth ||
        stageX > stageHalfWidth ||
        stageY < -stageHalfHeight ||
        stageY > stageHalfHeight
      ) {
        actions.setPointerNotOverStage();
      } else {
        actions.setPointerOverStage({ stageX, stageY });
      }
    }
  ),

  stageDisplaySize: { width: stageWidth, height: stageHeight },
  setStageDisplayWidth: action((state, width) => {
    const height = Math.round(stageHeight * (width / stageWidth));
    state.stageDisplaySize = { width, height };
  }),
  setStageDisplayHeight: action((state, height) => {
    const width = Math.round(stageWidth * (height / stageHeight));
    state.stageDisplaySize = { width, height };
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
  demoSidebar,
  keyboardShortcutsHelpContent,
  codeEditorFontSize: defaultCodeEditorFontSize,
  setCodeEditorFontSize: action((state, size) => {
    state.codeEditorFontSize = size;
  }),
  layoutStyle: "split-screen",
  setLayoutStyle: action((state, style) => {
    state.layoutStyle = style;
  }),
  helpSidebarOrientation: "vertical",
  setHelpSidebarOrientation: action((state, orientation) => {
    state.helpSidebarOrientation = orientation;
  }),
  tabs: [],
  setTabs: action((state, newTabs) => {
    state.tabs = newTabs;
  }),
  resizablePanelsGroupRef: null,
  setResizablePanelsGroupRef: action((state, groupRef) => {
    state.resizablePanelsGroupRef = groupRef;
  })
};

export interface IUserConfirmations {
  deleteAssetFlow: DeleteAssetFlow;
  deleteProjectFlow: DeleteProjectFlow;
  deleteManyProjectsFlow: DeleteManyProjectsFlow;

  createProjectFlow: CreateProjectFlow;
  createProjectFromDemoFlow: CreateProjectFromDemoFlow;
  startTutorialAtCheckpointFlow: StartTutorialAtCheckpointFlow;
  addAssetsFlow: AddAssetsFlow;
  addClipArtFlow: AddClipArtFlow;
  renameAssetFlow: RenameAssetFlow;
  renameProjectFlow: RenameProjectFlow;
  displayScreenshotFlow: DisplayScreenshotFlow;
  saveProjectAsFlow: SaveProjectAsFlow;
  uploadZipfilesFlow: UploadZipfilesFlow;
  codeDiffHelpFlow: CodeDiffHelpFlow;
  cropScaleImageFlow: CropScaleImageFlow;
  shareTutorialFlow: ShareTutorialFlow;

  downloadZipfileFlow: DownloadZipfileFlow;

  viewCodeDiffFlow: ViewCodeDiffFlow;
}

// TODO: Better name than 'confirmations'.
//
export const userConfirmations: IUserConfirmations = {
  deleteAssetFlow,
  deleteProjectFlow,
  deleteManyProjectsFlow,

  createProjectFlow,
  createProjectFromDemoFlow,
  startTutorialAtCheckpointFlow,
  addAssetsFlow,
  addClipArtFlow,
  renameAssetFlow,
  renameProjectFlow,
  displayScreenshotFlow,
  saveProjectAsFlow,
  uploadZipfilesFlow,
  codeDiffHelpFlow,
  cropScaleImageFlow,
  shareTutorialFlow,

  downloadZipfileFlow,

  viewCodeDiffFlow,
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

// TODO: Does this interface belong somewhere else?
export interface IErrorReport {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pytchError: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorContext: any;
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
