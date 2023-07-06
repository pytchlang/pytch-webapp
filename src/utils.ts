import { action, Action, ActionCreator, State } from "easy-peasy";
import React from "react";

export const withinApp = (url: string) => {
  return url[0] === "/" ? process.env.PUBLIC_URL + url : url;
};

/** Makes the given URL be within the main site.  This is to allow
 * deployments other than to the root of the domain.  The environment
 * variable REACT_APP_DEPLOY_BASE_URL gives the site's base URL. */
export const withinSite = (url: string) => {
  return process.env.REACT_APP_DEPLOY_BASE_URL + url;
};

export const delaySeconds = (seconds: number) => {
  const timeoutMs = PYTCH_CYPRESS()["instantDelays"] ? 0 : 1000.0 * seconds;
  return new Promise((r) => setTimeout(r, timeoutMs));
};

export const ancestorHavingClass = (elt: HTMLElement, className: string) => {
  while (!elt.classList.contains(className)) {
    const parent = failIfNull(
      elt.parentElement,
      `no parent while looking for ${className}`
    );
    elt = parent;
  }
  return elt;
};

// To allow testing to hook into various aspects of behaviour:
const PYTCH_CYPRESS_default = {
  instantDelays: false,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const PYTCH_CYPRESS = () => {
  if ((window as any)["PYTCH_CYPRESS"] == null) {
    (window as any)["PYTCH_CYPRESS"] = PYTCH_CYPRESS_default;
  }
  return (window as any)["PYTCH_CYPRESS"];
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Load a script from the given `src`, by appending a `<script>`
 * element as a child of the given `containerElt`.  Returns a promise
 * which resolves when the script's `onload` event fires. */
export const loadScript = (
  containerElt: HTMLElement,
  src: string
): Promise<void> =>
  new Promise(function (resolve, reject) {
    const scriptElt = document.createElement("script");
    containerElt.appendChild(scriptElt);

    scriptElt.type = "text/javascript";
    scriptElt.async = true;

    scriptElt.onerror = (err) => {
      reject(err);
    };

    scriptElt.onload = () => {
      resolve();
    };

    scriptElt.src = src;
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPropertyByPath(target: any, pathStr: string) {
  const path = pathStr.split(".");
  return path.reduce((acc, cur) => acc[cur] ?? {}, target);
}

export const failIfNull = function <T>(
  maybeX: T | null | undefined,
  errorIfNull: string
): T {
  if (maybeX == null) throw Error(errorIfNull);
  return maybeX;
};

export const envVarOrFail = (varName: string): string => {
  const maybeVarValue = process.env[varName];
  if (maybeVarValue == null) {
    throw new Error(`env.var ${varName} missing`);
  }
  return maybeVarValue;
};

// For exhaustiveness checking, as per TypeScript Handbook.
export const assertNever = (x: never): never => {
  throw Error(`should not be here; got ${JSON.stringify(x)}`);
};

export function propSetterAction<
  ModelT extends object,
  PropNameT extends keyof State<ModelT>
>(propName: PropNameT): Action<ModelT, State<ModelT>[PropNameT]> {
  return action((s, val) => {
    s[propName] = val;
  });
}

export const submitOnEnterKeyFun = (
  submitFun: () => void,
  isEnabled: boolean
): React.KeyboardEventHandler => (evt) => {
  if (evt.key === "Enter") {
    evt.preventDefault();
    if (isEnabled) {
      submitFun();
    }
  }
};

interface WithStringValue {
  value: string;
}

export function onChangeFun<EltType extends HTMLElement & WithStringValue>(
  setFun: ActionCreator<string>
) {
  return (e: React.ChangeEvent<EltType>) => setFun(e.target.value);
}

export function focusOrBlurFun<Elt extends HTMLElement>(
  elementRef: React.RefObject<Elt>,
  isActive: boolean,
  isInteractable: boolean
) {
  if (!isActive) return () => {};

  const element = () =>
    failIfNull(elementRef.current, "isActive but elementRef null");

  return isInteractable ? () => element().focus() : () => element().blur();
}

export const readArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => resolve(fr.result as ArrayBuffer);
    fr.readAsArrayBuffer(file);
  });
};

// Convert (eg) ProgressUpdate error for unreadable file into something
// a bit more human-friendly:
export const simpleReadArrayBuffer = async (file: File) => {
  try {
    return await readArrayBuffer(file);
  } catch (e) {
    throw new Error("problem reading file");
  }
};

export const dateAsLocalISO8601 = (date: Date) => {
  const y = date.getFullYear();
  const m = date.getMonth() + 1; // Convert to 1-based
  const d = date.getDate();
  const H = date.getHours();
  const M = date.getMinutes();
  const S = date.getSeconds();

  const sy = y.toString();
  const sm = m.toString().padStart(2, "0");
  const sd = d.toString().padStart(2, "0");
  const sH = H.toString().padStart(2, "0");
  const sM = M.toString().padStart(2, "0");
  const sS = S.toString().padStart(2, "0");

  // Avoid colons (forbidden in some filesystems).
  return `${sy}${sm}${sd}T${sH}${sM}${sS}`;
};
