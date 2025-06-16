import { KeyboardEvent as ReactKeyboardEvent } from "react";

export const itemOffsetFromKey = new Map<string, number>([
  ["ArrowDown", 1],
  ["ArrowUp", -1],
  ["PageDown", 5],
  ["PageUp", -5],
]);

export const itemAbsoluteFromKey = (
  key: string,
  nItems: number
): number | undefined => {
  switch (key) {
    case "Home":
      return 0;
    case "End":
      return nItems - 1;
    default:
      return undefined;
  }
};

export const handleMovementKeys = (
  containerDiv: HTMLDivElement,
  itemSelector: string,
  evt: ReactKeyboardEvent
) => {
  // Unclear why the default behaviour is for ArrowDown to allow moving
  // out of the menu but ArrowUp to be clamped at the top.  Use "clamp"
  // behaviour for both.
  //
  // Also, handle this ourselves, to allow focus of disabled items,
  // which gives consistency of movement when items are sometimes
  // enabled and sometimes disabled.

  const key = evt.key;
  switch (key) {
    case "ArrowUp":
    case "ArrowDown":
    case "PageUp":
    case "PageDown":
    case "Home":
    case "End": {
      const activeElt = document.activeElement as HTMLElement;
      if (activeElt == null) {
        console.warn("no focused element in document");
        return;
      }

      const allItems = Array.from(
        containerDiv.querySelectorAll<HTMLElement>(itemSelector)
      );
      const lastItemIdx = allItems.length - 1;
      const oldActiveIdx = allItems.indexOf(activeElt);

      if (oldActiveIdx === -1) {
        console.warn("could not find active item in array");
        return;
      }

      const maybeOffset = itemOffsetFromKey.get(key);
      const rawNewActiveIdx =
        maybeOffset == null
          ? itemAbsoluteFromKey(key, allItems.length)
          : oldActiveIdx + maybeOffset;

      if (rawNewActiveIdx == null) {
        console.warn("did not get valid new active-item index for key", key);
        return;
      }

      const newActiveIdx = Math.min(lastItemIdx, Math.max(0, rawNewActiveIdx));

      allItems[newActiveIdx].focus();
      evt.stopPropagation();
      evt.preventDefault();
    }
  }
};
