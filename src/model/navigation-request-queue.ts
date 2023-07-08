import { Action, Thunk, action, thunk } from "easy-peasy";
import { IPytchAppModel } from ".";
import { NavigateOptions } from "react-router-dom";

export type NavigateArgs = {
  path: string;
  opts?: NavigateOptions;
};

export type NavigationRequestQueue = {
  seqnum: number;
  queue: Array<NavigateArgs>;

  /** Enqueue a navigation request.  This is a "one-slot" queue, in that
   * if something is enqueued while the queue is not empty, the
   * newly-enqueued item *replaces* the existing item.  Therefore at
   * most one item can be in the queue at once.  The `path` property of
   * the `payload` should be relative to the app, i.e., the caller of
   * `enqueue()` should not include the `BASE_URL`. */
  enqueue: Action<NavigationRequestQueue, NavigateArgs>;

  clear: Action<NavigationRequestQueue>;
};

export let navigationRequestQueue: NavigationRequestQueue = {
  seqnum: 77000,
  queue: [],
  enqueue: action((state, request) => {
    state.seqnum += 1;
    state.queue = [request];
  }),
  clear: action((state) => {
    if (state.queue.length === 0)
      throw new Error("NavigationRequestQueue.clear(): queue empty");
    state.seqnum += 1;
    state.queue = [];
  }),
};
