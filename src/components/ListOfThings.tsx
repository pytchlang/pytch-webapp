import React, {
  createContext,
  FocusEventHandler,
  PropsWithChildren,
  KeyboardEvent as ReactKeyboardEvent,
  useState,
} from "react";
import classNames from "classnames";

const itemsOfList = (containerDiv: HTMLDivElement) => {
  const allItems = Array.from(
    containerDiv.querySelectorAll(":scope div.ListOfThings-Item")
  );
  const maybeFocusedIndex = allItems.findIndex((elt) =>
    elt.classList.contains("hasFocus")
  );

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
  const maybeTargetItem = allItems[targetIndex] as HTMLElement | undefined;

  // Perhaps user has tried to move past start/end of list:
  if (maybeTargetItem == null) return;

  // The ListOfThings.Item itself might or might not be focusable.
  // E.g., if the item contains a CaptiveContextMenu, then the CCMenu
  // will be the focusable element.
  focusEltOrDescendant(maybeTargetItem);
};

type ListOfThingsProps = object;
const Container: React.FC<PropsWithChildren<ListOfThingsProps>> = ({
  children,
}) => {
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
    }
  };

  return (
    <div tabIndex={-1} onKeyDown={containerKeyDown}>
      {children}
    </div>
  );
};

type ItemContextT = {
  focusBlurProps: { onFocus: FocusEventHandler; onBlur: FocusEventHandler };
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
      case " ":
        console.log("Activate!");
        if (onActivate != null) {
          onActivate();
        }
        evt.preventDefault();
        break;
    }
  };

  const contextValue: ItemContextT = {
    focusBlurProps: { onFocus: setFocus, onBlur: clearFocus },
  };

  const tabIndexProps = nonFocusable ? {} : { tabIndex: 0 };
  const classes = classNames("ListOfThings-Item", { hasFocus }, className);
  return (
    <ItemContext.Provider value={contextValue}>
      <div
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
  Item,
  ItemContext,
};
