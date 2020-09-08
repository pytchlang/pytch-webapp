import { Action, action } from "easy-peasy";

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
  ]),
  show: action((state, modalName) => {
    state.isShowing.set(modalName, true);
  }),
  hide: action((state, modalName) => {
    state.isShowing.set(modalName, false);
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

export interface IErrorReport {
  threadInfo: any; // TODO
  pytchError: any; // TODO
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
