import { Action, action } from "easy-peasy";

export interface IHelpSidebar {
  isVisible: boolean;
  toggleVisibility: Action<IHelpSidebar>;
}

export const helpSidebar: IHelpSidebar = {
  isVisible: false,
  toggleVisibility: action((state) => {
    state.isVisible = !state.isVisible;
  }),
};
