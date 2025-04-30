import React, {
  createContext,
  PropsWithChildren,
  KeyboardEvent as ReactKeyboardEvent,
  useId,
  useRef,
} from "react";
import classNames from "classnames";
import { failIfNull } from "../utils";

const itemsOfList = (containerDiv: HTMLDivElement) => {
  const allItems = Array.from(
    containerDiv.querySelectorAll<HTMLElement>(":scope div.ListOfThings-Item")
  );
  const itemContainingFocus = containerDiv.querySelector<HTMLElement>(
    ":scope .ListOfThings-Item:focus-within"
  );
  const maybeFocusedIndex =
    itemContainingFocus == null ? -1 : allItems.indexOf(itemContainingFocus);

  return { allItems, maybeFocusedIndex };
};

function focusEltOrDescendant(elt: HTMLElement) {
  if (elt.getAttribute("tabindex") != null) {
    elt.focus();
  } else {
    // Find the actual focusable element.
    const maybeInnerTarget =
      elt.querySelector<HTMLElement>(":scope *[tabindex]");
    maybeInnerTarget?.focus();
  }
}

const focusOffsetItem = (
  containerDiv: HTMLDivElement,
  focusIndexOffset: number
) => {
  const { allItems, maybeFocusedIndex } = itemsOfList(containerDiv);
  if (maybeFocusedIndex === -1) {
    // TODO: Anything useful we can do here?
    return;
  }

  const targetIndex = maybeFocusedIndex + focusIndexOffset;
  const maybeTargetItem = allItems[targetIndex];

  // Perhaps user has tried to move past start/end of list:
  if (maybeTargetItem == null) return;

  // The ListOfThings.Item itself might or might not be focusable.
  // E.g., if the item contains a CaptiveContextMenu, then the CCMenu
  // will be the focusable element.
  focusEltOrDescendant(maybeTargetItem);
};

const focusAbsoluteItem = (
  containerDiv: HTMLDivElement,
  focusIndex: number
) => {
  const { allItems } = itemsOfList(containerDiv);
  const effectiveIndex =
    focusIndex >= 0 ? focusIndex : allItems.length + focusIndex;
  const maybeTargetItem = allItems[effectiveIndex];
  if (maybeTargetItem != null) {
    focusEltOrDescendant(maybeTargetItem);
  }
};

const focusFirstAdd = (containerDiv: HTMLDivElement) => {
  const idNub = failIfNull(
    containerDiv.dataset.listIdNub,
    "focusFirstAdd(): No data-list-id-nub attr"
  );
  const firstAddButton = containerDiv.querySelector<HTMLButtonElement>(
    `:scope button[data-containing-list-id-nub="${idNub}"]`
  );
  firstAddButton?.focus();
};

type ContainerContextT = {
  idNub: string;
};
const ContainerContext = createContext<ContainerContextT | null>(null);

type ListOfThingsProps = object;
const Container: React.FC<PropsWithChildren<ListOfThingsProps>> = ({
  children,
}) => {
  const idNub = useId();

  const containerKeyDown = (evt: ReactKeyboardEvent) => {
    const containerDiv = evt.currentTarget as HTMLDivElement;
    switch (evt.key) {
      case "ArrowUp":
      case "ArrowLeft":
        focusOffsetItem(containerDiv, -1);
        evt.preventDefault();
        break;
      case "ArrowDown":
      case "ArrowRight":
        focusOffsetItem(containerDiv, 1);
        evt.preventDefault();
        break;

      // TODO: Where is "+" on other keyboard layouts?  Does that
      // matter?
      case "+": {
        // Don't steal the "+" from the text editor.
        //
        // TODO: Are there other situations where we should NOT
        // intercept the "+"?
        //
        const evtElt = evt.target as HTMLElement;
        if (evtElt.tagName !== "TEXTAREA") {
          focusFirstAdd(containerDiv);
        }
        break;
      }
    }
  };

  const contextValue: ContainerContextT = { idNub };

  return (
    <ContainerContext.Provider value={contextValue}>
      <div data-list-id-nub={idNub} tabIndex={-1} onKeyDown={containerKeyDown}>
        {children}
      </div>
    </ContainerContext.Provider>
  );
};

////////////////////////////////////////////////////////////////////////

type ItemContextT = {
  focusBlurProps: { onFocus: FocusEventHandler; onBlur: FocusEventHandler };
  seizeFocus: () => void;
};
const ItemContext = createContext<ItemContextT | null>(null);

type ItemProps = {
  nonFocusable?: boolean;
  className?: string;
  onActivate?: () => void;
};
const Item: React.FC<PropsWithChildren<ItemProps>> = ({
  nonFocusable,
  className,
  onActivate,
  children,
}) => {
  const [hasFocus, setHasFocus] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  const setFocus: FocusEventHandler = () => setHasFocus(true);
  const clearFocus: FocusEventHandler = () => setHasFocus(false);

  const maybeSetFocus: FocusEventHandler = (evt) => {
    // Only apply class if the actual item (and not a contained button
    // or similar) has just received focus.
    if (evt.target === evt.currentTarget) {
      setFocus(evt);
    }
  };

  const itemKeyDown = (evt: ReactKeyboardEvent) => {
    switch (evt.key) {
      case "Enter":
      case " ": {
        // TODO: Is there a cleaner way of doing this?  E.g., what if we
        // have a ListOfThings where some have text-input boxes?
        const tgtElt = evt.target as HTMLElement;
        if (tgtElt.tagName !== "TEXTAREA") {
          if (onActivate != null) {
            onActivate();
          }
          evt.preventDefault();
        }
        break;
      }
    }
  };

  const contextValue: ItemContextT = {
    focusBlurProps: { onFocus: setFocus, onBlur: clearFocus },
    seizeFocus: () => {
      setHasFocus(true);
      const divElt = divRef.current;
      if (divElt != null) {
        focusEltOrDescendant(divElt);
      }
    },
  };

  const tabIndexProps = nonFocusable ? {} : { tabIndex: 0 };
  const classes = classNames("ListOfThings-Item", { hasFocus }, className);
  return (
    <ItemContext.Provider value={contextValue}>
      <div
        ref={divRef}
        className={classes}
        {...tabIndexProps}
        onFocus={maybeSetFocus}
        onBlur={clearFocus}
        onKeyDown={itemKeyDown}
      >
        {children}
      </div>
    </ItemContext.Provider>
  );
};

export const ListOfThings = {
  Container,
  ContainerContext,
  Item,
  ItemContext,
};
