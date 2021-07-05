import { Action, action } from "easy-peasy";
import { AttributeWatcherRenderInstruction } from "../skulpt-connection/render-instructions";

export interface IVariableWatchers {
  watchers: Array<AttributeWatcherRenderInstruction>;

  setWatchers: Action<
    IVariableWatchers,
    Array<AttributeWatcherRenderInstruction>
  >;
}

export const variableWatchers: IVariableWatchers = {
  watchers: [],

  setWatchers: action((state, watchers) => {
    state.watchers = watchers;
  }),
};
