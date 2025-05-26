import { MouseEventHandler } from "react";
import { ancestorHavingClass, failIfNull } from "../../utils";
import classNames from "classnames";

export const kFocusGroupContainerClassName = "focus-group__container";
export const kFocusGroupItemClassName = "focus-group__item";
export const kFocusGroupFallbackClassName = "focus-group__fallback";

/** Create class-names string for a focus-group container from the base
 * container class plus the given `extraClassname`. */
export function focusGroupContainerClass(extraClassname: string): string {
  return classNames(kFocusGroupContainerClassName, extraClassname);
}

/** Return whether `elt` is NOT inside a closed `<details>` element.
 * Only works for the particular case we need, which is a
 * HelpSidebarSection.
 * */
function isNavigable(elt: HTMLElement): boolean {
  if (elt.tagName !== "SUMMARY") {
    return true;
  }

  const grandParent = elt.parentElement?.parentElement;
  if (grandParent == null || grandParent.tagName !== "DETAILS") {
    return true;
  }

  return (grandParent as HTMLDetailsElement).open;
}

function eltOrSectionSummary(elt: HTMLElement): HTMLElement {
  if (elt.tagName !== "SUMMARY") {
    return elt;
  }

  const grandParent = elt.parentElement?.parentElement;
  if (grandParent == null || grandParent.tagName !== "DETAILS") {
    return elt;
  }

  const detailsElt = grandParent as HTMLDetailsElement;
  if (detailsElt.open) {
    return elt;
  }

  const summaryChild = failIfNull(
    detailsElt.firstChild,
    "<details> has no child"
  );
  if (summaryChild.nodeType !== Node.ELEMENT_NODE) {
    throw new Error("<details> has non-element as first child");
  }

  const summaryElt = summaryChild as HTMLElement;
  if (summaryElt.tagName !== "SUMMARY") {
    throw new Error("<details> has non-<summary> as first child");
  }

  return summaryElt;
}

export class GroupedFocusManager {
  bookmarkFromKey_: Map<string, number>;
  pendingKey: string | null;
  onItemClick: MouseEventHandler<HTMLElement>;

  constructor() {
    this.bookmarkFromKey_ = new Map<string, number>();
    this.pendingKey = null;
    this.onItemClick = (evt) => {
      this.bookmarkItem(evt.currentTarget);
    };
  }

  setPendingKey(targetKey: string) {
    if (this.pendingKey != null) {
      console.warn(
        "GroupedFocusManager.setPendingKey(): Discarding",
        this.pendingKey,
        "to replace with",
        targetKey
      );
    }
    this.pendingKey = targetKey;
  }

  acquirePendingKey(targetKey: string) {
    const wanted = this.pendingKey === targetKey;
    if (wanted) {
      this.pendingKey = null;
      return true;
    } else {
      return false;
    }
  }

  static containedItemElts(elt: HTMLElement): Array<HTMLElement> {
    return Array.from(
      elt.getElementsByClassName(kFocusGroupItemClassName)
    ) as Array<HTMLElement>;
  }

  static keyFromElt(elt: HTMLElement): string {
    const mKey = elt.dataset.groupedFocusKey;
    if (mKey == null) {
      throw new Error("elt has no groupedFocusKey data attr");
    }
    return mKey;
  }

  static itemContext(containerElt: HTMLElement, itemElt: HTMLElement) {
    const allItems = GroupedFocusManager.containedItemElts(containerElt);
    const mIndex = allItems.findIndex((elt) => elt === itemElt);
    if (mIndex === -1) {
      throw new Error("itemElt not found in container");
    }
    return { allItems, index: mIndex };
  }

  static itemIndex(containerElt: HTMLElement, itemElt: HTMLElement): number {
    return GroupedFocusManager.itemContext(containerElt, itemElt).index;
  }

  bookmarkFromKey(key: string): number {
    const mBookmarkIndex = this.bookmarkFromKey_.get(key);
    if (mBookmarkIndex == null) {
      this.bookmarkFromKey_.set(key, 0);
      return 0;
    } else {
      return mBookmarkIndex;
    }
  }

  setBookmark(key: string, index: number) {
    this.bookmarkFromKey_.set(key, index);
  }

  setTabFocusability(items: Array<HTMLElement>, bookmarkIndex: number) {
    items.forEach((item, itemIdx) => {
      item.tabIndex = itemIdx === bookmarkIndex ? 0 : -1;
    });
  }

  setContainerTabFocusability(elt: HTMLElement) {
    const items = GroupedFocusManager.containedItemElts(elt);
    const key = GroupedFocusManager.keyFromElt(elt);
    const bookmarkIndex = this.bookmarkFromKey(key);
    this.setTabFocusability(items, bookmarkIndex);
  }

  bookmarkAndFocus(containerElt: HTMLElement, itemElt: HTMLElement) {
    const key = GroupedFocusManager.keyFromElt(containerElt);
    const itemContext = GroupedFocusManager.itemContext(containerElt, itemElt);
    this.setBookmark(key, itemContext.index);
    itemElt.focus();
    this.setTabFocusability(itemContext.allItems, itemContext.index);
  }

  // TODO: Should we simplify to just "first" or "last"?
  focusAbsoluteItem(containerEltOrKey: HTMLElement | string, index: number) {
    const containerElt =
      containerEltOrKey instanceof HTMLElement
        ? containerEltOrKey
        : this.maybeContainerForKey(containerEltOrKey);

    if (containerElt == null) {
      console.warn("not a valid container:", containerEltOrKey);
      return;
    }

    const allItems = GroupedFocusManager.containedItemElts(containerElt);
    const navigableItems = allItems.filter(isNavigable);

    if (index < 0) {
      index += navigableItems.length;
    }

    const newFocusedItem = navigableItems[index];
    if (newFocusedItem == null) {
      console.warn(
        `bad index ${index} re navigable descendants of ${containerElt}`
      );
      return;
    }

    this.bookmarkAndFocus(containerElt, newFocusedItem);
  }

  focusOffsetItem(containerElt: HTMLElement, offset: number) {
    const allItems = GroupedFocusManager.containedItemElts(containerElt);
    const navigableItems = allItems.filter(isNavigable);
    const focusedElt = containerElt.querySelector<HTMLElement>(":scope :focus");
    if (focusedElt == null) {
      console.warn("no focused elt");
      return;
    }

    const focusedNavigableIndex = navigableItems.indexOf(focusedElt);
    if (focusedNavigableIndex === -1) {
      console.warn("focused elt not found in navigable items");
      return;
    }

    const newFocusIndex = focusedNavigableIndex + offset;
    const newFocusedItem = navigableItems[newFocusIndex];
    if (newFocusedItem == null) {
      // Moved outside list of navigable items.
      return;
    }

    this.bookmarkAndFocus(containerElt, newFocusedItem);
  }

  focusBookmarkedItem(containerElt: HTMLElement) {
    const key = GroupedFocusManager.keyFromElt(containerElt);

    const items = GroupedFocusManager.containedItemElts(containerElt);
    const bookmark = this.bookmarkFromKey(key);
    const mBookmarkedItem = items[bookmark];
    if (mBookmarkedItem != null) {
      const focusTarget = eltOrSectionSummary(mBookmarkedItem);
      this.bookmarkAndFocus(containerElt, focusTarget);
      return;
    }

    const mLastItem = items[items.length - 1];
    if (mLastItem != null) {
      const focusTarget = eltOrSectionSummary(mLastItem);
      this.bookmarkAndFocus(containerElt, focusTarget);
      return;
    }

    const fallbacks = containerElt.getElementsByClassName(
      kFocusGroupFallbackClassName
    );
    const mFallback = fallbacks[0] as HTMLElement | null;
    if (mFallback != null) {
      mFallback.focus();
      return;
    }

    console.warn("No descendant item or fallback found for", key);
  }

  maybeContainerForKey(key: string) {
    return document.querySelector<HTMLElement>(
      `.${kFocusGroupContainerClassName}[data-grouped-focus-key="${key}"]`
    );
  }

  focusBookmarkedItemOrQueueRequest(key: string) {
    const mContainer = this.maybeContainerForKey(key);
    if (mContainer != null) {
      this.focusBookmarkedItem(mContainer);
    } else {
      this.setPendingKey(key);
    }
  }

  bookmarkItem(elt: HTMLElement) {
    const containerElt = ancestorHavingClass(
      elt,
      kFocusGroupContainerClassName
    );
    const key = GroupedFocusManager.keyFromElt(containerElt);
    const eltIdx = GroupedFocusManager.itemIndex(containerElt, elt);
    this.setBookmark(key, eltIdx);
    this.setContainerTabFocusability(containerElt);
  }

  bookmarkAndFocusItemIfNotableFun(enabled: boolean) {
    if (!enabled) return () => void 0;

    return (innerDiv: HTMLDivElement) => {
      if (innerDiv == null) return;

      const focusItemDiv = innerDiv.parentElement;
      if (focusItemDiv == null) return;

      if (!focusItemDiv.classList.contains(kFocusGroupItemClassName)) {
        console.warn("parent is not focus-group item", focusItemDiv);
      }

      this.bookmarkItem(focusItemDiv);
      focusItemDiv.focus();
    };
  }
}

export let groupedFocusManager = new GroupedFocusManager();

function containsSuppressingItem(elt: HTMLElement) {
  const mSuppressingItem = elt.querySelector<HTMLElement>(
    `:scope .${kFocusGroupItemClassName}[data-suppress-focus-group-navigation]`
  );
  return mSuppressingItem != null;
}

export function containerRefCallback<ElementT extends HTMLElement>() {
  let onKeyDown: ((evt: KeyboardEvent) => void) | null = null;
  let eltWithHandler: HTMLElement | null = null;

  return (elt: ElementT | null) => {
    if (elt == null) {
      if (eltWithHandler != null && onKeyDown != null) {
        eltWithHandler.removeEventListener("keydown", onKeyDown);
      }
    } else {
      const key = GroupedFocusManager.keyFromElt(elt);

      groupedFocusManager.setContainerTabFocusability(elt);
      if (eltWithHandler == null) {
        onKeyDown = (evt) => {
          // Do nothing if the user is navigating a dropdown menu.
          if (containsSuppressingItem(elt)) return;

          switch (evt.key) {
            case "ArrowRight":
            case "ArrowDown":
              groupedFocusManager.focusOffsetItem(elt, 1);
              evt.preventDefault();
              break;

            case "ArrowLeft":
            case "ArrowUp":
              groupedFocusManager.focusOffsetItem(elt, -1);
              evt.preventDefault();
              break;

            case "Home":
              groupedFocusManager.focusAbsoluteItem(elt, 0);
              break;

            case "End":
              groupedFocusManager.focusAbsoluteItem(elt, -1);
              break;
          }
        };
        eltWithHandler = elt;
        elt.addEventListener("keydown", onKeyDown);

        const focusRequestPending = groupedFocusManager.acquirePendingKey(key);
        if (focusRequestPending) {
          groupedFocusManager.focusBookmarkedItem(elt);
        }
      }
    }
  };
}
