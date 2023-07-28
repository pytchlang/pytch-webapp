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

  // TODO: Should this return a Promise which resolves when the request
  // is taken out of the queue? and rejects if the request is ejected
  // from the queue by another request before the first one has been
  // acted on?
  //
  /** Enqueue a navigation request.  This is a "one-slot" queue, in that
   * if something is enqueued while the queue is not empty, the
   * newly-enqueued item *replaces* the existing item.  Therefore at
   * most one item can be in the queue at once.  The `path` property of
   * the `payload` should be relative to the app, i.e., the caller of
   * `enqueue()` should not include the `BASE_URL`. */
  enqueue: Action<NavigationRequestQueue, NavigateArgs>;

  clear: Action<NavigationRequestQueue>;
  drain: Thunk<
    NavigationRequestQueue,
    void,
    void,
    IPytchAppModel,
    NavigateArgs | null
  >;
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
  drain: thunk((actions, _voidPayload, helpers) => {
    let queue = helpers.getState().queue;
    if (queue.length === 0) {
      return null;
    }
    const head = queue[0];
    actions.clear();
    return head;
  }),
};
