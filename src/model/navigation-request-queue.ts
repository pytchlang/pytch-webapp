import { Action, Thunk, action, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { NavigateOptions } from "react-router-dom";

export type NavigateArgs = {
  path: string;
  opts?: NavigateOptions;
};

export type NavigationRequestQueue = {
};

export let navigationRequestQueue: NavigationRequestQueue = {
};
