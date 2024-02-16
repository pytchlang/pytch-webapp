import { action, Action, ActionCreator, State, ThunkCreator } from "easy-peasy";
import React from "react";
import { guessedMimeType } from "./storage/guessed-mime-type";

export type EmptyProps = Record<string, never>;

export const delaySeconds = (seconds: number, forceRealDelay = false) => {
  const useZeroDelay = PYTCH_CYPRESS()["instantDelays"] && !forceRealDelay;
  const timeoutMs = useZeroDelay ? 0 : 1000.0 * seconds;
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

export const PYTCH_CYPRESS = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const GLOBALS = globalThis as any;
  if (GLOBALS["PYTCH_CYPRESS"] == null)
    GLOBALS["PYTCH_CYPRESS"] = PYTCH_CYPRESS_default;
  return GLOBALS["PYTCH_CYPRESS"];
};

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

export async function copyTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.log(
      "Could not copy to clipboard",
      "(an error is expected if running under Cypress):",
      err
    );
  }
  PYTCH_CYPRESS()["latestTextCopied"] = text;
}

export const failIfNull = function <T>(
  maybeX: T | null | undefined,
  errorIfNull: string
): T {
  if (maybeX == null) throw Error(errorIfNull);
  return maybeX;
};

// For exhaustiveness checking, as per TypeScript Handbook.
export const assertNever = (x: never): never => {
  throw Error(`should not be here; got ${JSON.stringify(x)}`);
};

export function propSetterAction<
  ModelT extends object,
  PropNameT extends keyof State<ModelT>,
>(propName: PropNameT): Action<ModelT, State<ModelT>[PropNameT]> {
  return action((s, val) => {
    s[propName] = val;
  });
}

export const submitOnEnterKeyFun =
  (submitFun: () => void, isEnabled: boolean): React.KeyboardEventHandler =>
  (evt) => {
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
  setFun: ActionCreator<string> | ThunkCreator<string>
) {
  return (e: React.ChangeEvent<EltType>) => setFun(e.target.value);
}

export function focusOrBlurFun<Elt extends HTMLElement>(
  elementRef: React.RefObject<Elt>,
  isActive: boolean,
  isInteractable: boolean
) {
  if (!isActive)
    return () => {
      /* Do nothing. */
    };

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

////////////////////////////////////////////////////////////////////////

export function valueCell<ValueT>(initialValue: ValueT) {
  let _value: ValueT = initialValue;
  return {
    get() {
      return _value;
    },
    set(value: ValueT) {
      _value = value;
    },
  };
}

////////////////////////////////////////////////////////////////////////

const _octetStringOfU8: Array<string> = (() => {
  const strings = [];
  for (let i = 0; i <= 0xff; ++i) strings.push(i.toString(16).padStart(2, "0"));
  return strings;
})();

const _hexOfBuffer = (data: ArrayBuffer): string => {
  const u8s = new Uint8Array(data);
  const octetStrings = new Array(u8s.length);
  for (let i = 0; i !== u8s.length; ++i)
    octetStrings[i] = _octetStringOfU8[u8s[i]];
  return octetStrings.join("");
};

const _utf8OfString = (str: string): ArrayBuffer =>
  new TextEncoder().encode(str.normalize()).buffer;

export async function hexSHA256(data: ArrayBuffer): Promise<string>;
export async function hexSHA256(data: string): Promise<string>;

export async function hexSHA256(data: ArrayBuffer | string): Promise<string> {
  const dataArray = typeof data === "string" ? _utf8OfString(data) : data;
  const hash = await globalThis.crypto.subtle.digest("SHA-256", dataArray);
  return _hexOfBuffer(hash);
}

export async function fetchArrayBuffer(...args: Parameters<typeof fetch>) {
  const rawResp = await fetch(...args);
  const data = await rawResp.arrayBuffer();
  return data;
}

export type MimeTypedArrayBuffer = {
  mimeType: string;
  data: ArrayBuffer;
};

export async function fetchMimeTypedArrayBuffer(
  ...args: Parameters<typeof fetch>
): Promise<MimeTypedArrayBuffer> {
  const rawResp = await fetch(...args);
  const mimeType = guessedMimeType(rawResp);
  const data = await rawResp.arrayBuffer();
  return { mimeType, data };
}

////////////////////////////////////////////////////////////////////////

export function parsedHtmlBody(
  htmlText: string,
  sourceLabel: string
): HTMLBodyElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");
  const body = failIfNull(
    doc.documentElement.querySelector("body"),
    `could not parse HTML body from "${sourceLabel}"`
  );
  return body;
}

////////////////////////////////////////////////////////////////////////

export function isDivOfClass(
  node: ChildNode,
  requiredClass: string
): node is HTMLDivElement {
  return (
    node instanceof HTMLDivElement && node.classList.contains(requiredClass)
  );
}

export function ensureDivOfClass(node: ChildNode, requiredClass: string) {
  if (!isDivOfClass(node, requiredClass)) {
    throw new Error(`expecting DIV of class "${requiredClass}"`);
  }
  return node;
}

////////////////////////////////////////////////////////////////////////

export const range = (
  start: number,
  end: number | undefined = undefined,
  step = 1
) => {
  let output: Array<number> = [];
  if (typeof end === "undefined") {
    end = start;
    start = 0;
  }
  for (let i = start; i < end; i += step) {
    output.push(i);
  }
  return output;
};
