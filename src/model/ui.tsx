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
    ]),
    show: action((state, modalName) => {
        state.isShowing.set(modalName, true);
    }),
    hide: action((state, modalName) => {
        state.isShowing.set(modalName, false);
    }),
}

export interface IInfoPanel {
    activeTabKey: string;
    setActiveTabKey: Action<IInfoPanel, string>;
}

export const infoPanel: IInfoPanel = {
    activeTabKey: "assets",
    setActiveTabKey: action((state, key) => { state.activeTabKey = key; }),
};
