import { promiseAndResolve } from "./utils";

const kAbandonedError = new Error(
  "the user abandoned the operation by navigating backwards/forwards"
);

export class NavigationAbandonmentGuard {
  exit: () => void;
  abandoned: Promise<void>;

  constructor() {
    const { promise, resolve } = promiseAndResolve();
    this.abandoned = promise;

    // Define function ignoring the "event" arg of the event listener.
    const abandon = () => resolve();
    window.addEventListener("popstate", abandon);
    this.exit = () => window.removeEventListener("popstate", abandon);
  }

  async throwIfAbandoned<ResultT>(
    resultPromise: Promise<ResultT>
  ): Promise<ResultT> {
    const sentinel = new Object();
    const outcome = await Promise.race([
      this.abandoned.then(() => sentinel),
      resultPromise,
    ]);
    if (Object.is(outcome, sentinel)) {
      throw kAbandonedError;
    } else {
      // The passed-in resultPromise must have won the race.
      return outcome as ResultT;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wasAbandoned(err: any) {
    return Object.is(err, kAbandonedError);
  }
}
