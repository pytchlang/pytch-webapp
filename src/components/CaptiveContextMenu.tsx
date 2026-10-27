import React, {
  createContext,
  KeyboardEventHandler,
  MouseEventHandler,
  PropsWithChildren,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Dropdown } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useNonNullContext } from "./hooks/non-null-context";
import { handleMovementKeys } from "./CaptiveContextMenu-utils";

/** Context for internal use by dropdown items within the container.
 * Allows items to, e.g., dismiss the dropdown menu. */
type ContextT = {
  ccMenuId: string;
  containerId: string;
  menuId: string;
  show: boolean;
  setShow(show: boolean): void;
  toggleShow(): void;
  focusContainer(): void;
};

const Context = createContext<ContextT | null>(null);

function isMenuToggleKeyEvent(evt: ReactKeyboardEvent): boolean {
  return (
    evt.key === "ContextMenu" ||
    (evt.shiftKey && evt.key === "F10") ||
    (evt.ctrlKey && evt.key === "/") ||
    (evt.ctrlKey && evt.key === ".")
  );
}

type ContainerProps = {
  accessibleName: string;
  isCurrent?: boolean;
  onClick?: MouseEventHandler;
  onKeyDown?: KeyboardEventHandler;
  onActivate?: () => void;
  className?: string;
};
/** Wrapper for the component which has the captive context menu.  The
 * actual context menu should be rendered as a
 * `CaptiveContextMenu.DropdownMenu` with its items rendered as
 * `CaptiveContextMenu.DropdownItem` instances.  It is common to have a
 * collection of elements which each have a captive context menu, and
 * for the whole collection to be navigable as a "focus group".  In this
 * case, the `CaptiveContextMenu.Container` (of each element in the
 * group) should have the appropriate `className` and `onClick` handler
 * — see `PytchScriptEditor`, `AssetCard`, and `ActorCard` for examples.
 *
 * In some cases, it should be possible to "active" the component having
 * a captive context menu.  The `onActivate` prop specifies what this
 * means.  See `ActorCard` and `PytchScriptEditor` for examples.
 *
 * The `accessibleName` is what assistive technology announces for the
 * component.  Without it, the name would be computed from all the text
 * content, which is typically long and unhelpful.  The component's
 * accessible description says how to open the menu.
 *
 * If `isCurrent` is true, the component is marked as the current one of
 * its set, e.g., the actor whose code, costumes, etc., are shown.
 * */
const Container: React.FC<PropsWithChildren<ContainerProps>> = ({
  accessibleName,
  isCurrent,
  onClick: callerOnClick,
  onKeyDown: callerOnKeyDown,
  onActivate,
  className,
  children,
}) => {
  callerOnClick ??= () => {};
  callerOnKeyDown ??= () => {};
  onActivate ??= () => {};

  const { t } = useTranslation("common");
  const divRef = useRef<HTMLDivElement | null>(null);
  const menuKeyPressedRef = useRef<boolean>(false);
  const [show, setShow] = useState<boolean>(false);
  const ccMenuId = useId();
  const containerId = `captive-context-menu-container${ccMenuId}`;
  const menuId = `captive-context-menu${ccMenuId}`;
  const hintId = `captive-context-menu-hint${ccMenuId}`;

  const toggleShow = () => setShow(!show);

  const focusContainer = () => {
    const div = divRef.current;
    if (div == null) return;
    div.focus();
  };

  // Add (and register "remove" clean-ups) for document-level click and
  // keypress listeners.
  useEffect(() => {
    if (!show) return;

    // If the context menu is shown, dismiss it on any click anywhere in
    // the whole document which is not on a descendant of ourself.
    const docClick = (evt: MouseEvent) => {
      let tgt = evt.target as HTMLElement | null;
      let closestId: string | null = null;
      while (tgt != null) {
        const maybeId = tgt.dataset.captiveContextMenuContainerId;
        if (maybeId != null) {
          closestId = maybeId;
          break;
        }
        tgt = tgt.parentElement;
      }

      if (closestId === containerId) return;

      setShow(false);
    };

    // The "Escape" key (anywhere) should dismiss the dropdown.  (This
    // handler is only set up if `shown`.)
    const docKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        setShow(false);
        focusContainer();
      }
    };

    document.addEventListener("click", docClick);
    document.addEventListener("keydown", docKeyDown);
    return () => {
      document.removeEventListener("keydown", docKeyDown);
      document.removeEventListener("click", docClick);
    };
  }, [show, containerId]);

  // When first rendered, focus the first dropdown-item.
  const itemSelector = `:scope a[data-ccm-container="${ccMenuId}"]`;
  useEffect(() => {
    if (!show) return;
    const containerDiv = divRef.current;
    if (containerDiv == null) return;
    const firstItem = containerDiv.querySelector<HTMLElement>(itemSelector);
    firstItem?.focus();
  }, [show, itemSelector]);

  // Handle keypresses into the element with captive context menu:
  //
  // Enter / Space — "activate" the element (unless TEXTAREA, in which
  // case ignore) via `onActivate()`
  //
  // (Shift-)Tab — if dropdown-menu visible, navigate through items
  // (including disabled ones) or out of menu; dismiss menu if
  // navigating out
  //
  // ArrowUp / ArrowDown / PageUp / PageDown / Home / End — if
  // dropdown-menu visible, navigate through non-disabled items,
  // clamping movement at first and last
  const containerKeyDown = (evt: ReactKeyboardEvent) => {
    if (isMenuToggleKeyEvent(evt)) {
      toggleShow();
      evt.preventDefault();
      return;
    }

    if (!show) {
      if (evt.key === "Enter" || evt.key === " ") {
        const tgtElt = evt.target as HTMLElement;

        // TODO: Is there a cleaner way of doing this?  For current use
        // cases this is OK.
        if (tgtElt.tagName !== "TEXTAREA") {
          onActivate();
          evt.preventDefault();
        }
      }

      callerOnKeyDown(evt);
    } else {
      const containerDiv = divRef.current;
      if (containerDiv != null) {
        if (evt.key === "Tab") {
          setShow(false);
        }

        handleMovementKeys(containerDiv, itemSelector, evt);
      }
    }
  };

  // Pressing the keyboard's "menu" key toggles our menu (via the keydown
  // handlers), but on some platforms the browser then also fires a
  // "contextmenu" event, which would show the browser's own context
  // menu.  Suppress that, while leaving right-click alone.  Capture the
  // keydown so we see it even if it is within our dropdown menu, whose
  // handler stops propagation.
  const containerKeyDownCapture = (evt: ReactKeyboardEvent) => {
    menuKeyPressedRef.current = evt.key === "ContextMenu";
  };
  const containerContextMenu: MouseEventHandler = (evt) => {
    if (menuKeyPressedRef.current) {
      evt.preventDefault();
      menuKeyPressedRef.current = false;
    }
  };

  const containerClick: MouseEventHandler = (evt) => {
    callerOnClick(evt);
    onActivate();
  };

  const contextValue: ContextT = {
    ccMenuId,
    containerId,
    menuId,
    show,
    setShow,
    toggleShow,
    focusContainer,
  };

  // If the dropdown-menu is shown, leave a mark which focus-group
  // navigation can find to avoid attempting to move focus between,
  // e.g., asset cards when arrow keys are pressed.
  const suppressFocusGroupNavigationProp = show
    ? { "data-suppress-focus-group-navigation": true }
    : {};

  return (
    <Context value={contextValue}>
      <div
        id={containerId}
        className={className}
        ref={divRef}
        role="button"
        aria-label={accessibleName}
        aria-describedby={hintId}
        aria-current={isCurrent || undefined}
        tabIndex={0}
        onKeyDown={containerKeyDown}
        onKeyDownCapture={containerKeyDownCapture}
        onContextMenu={containerContextMenu}
        onClick={containerClick}
        aria-expanded={show || undefined}
        aria-controls={menuId}
        {...suppressFocusGroupNavigationProp}
      >
        <span id={hintId} hidden>
          {t("captive-context-menu.hint")}
        </span>
        {children}
      </div>
    </Context>
  );
};

////////////////////////////////////////////////////////////////////////

/** Menu of choices relevant to the element which has a captive context
 * menu.  Should be rendered somewhere within a
 * `CaptiveContextMenu.Container`. */
const DropdownMenu: React.FC<PropsWithChildren<object>> = ({ children }) => {
  const ctx = useNonNullContext(Context);

  const onKeydown: KeyboardEventHandler = (evt) => {
    if (isMenuToggleKeyEvent(evt) && ctx.show) {
      ctx.setShow(false);
      evt.stopPropagation();
      evt.preventDefault();
      ctx.focusContainer();
    }
  };

  return (
    <Dropdown
      as="div"
      role="menu"
      id={ctx.menuId}
      show={ctx.show}
      onClick={ctx.toggleShow}
      onKeyDown={onKeydown}
      data-captive-context-menu-container-id={ctx.containerId}
    >
      <Dropdown.Toggle as="div">⋮</Dropdown.Toggle>
      <Dropdown.Menu align="end">{children}</Dropdown.Menu>
    </Dropdown>
  );
};

////////////////////////////////////////////////////////////////////////

type DropdownItemProps = {
  disabled?: boolean;
  className?: string;
  onInvoke(): void;
};
/** Within a `DropdownMenu`, there should be some `DropdownItem`
 * instances for the menu items the user can choose.  Must be rendered
 * within a `CaptiveContextMenu.DropdownMenu` which in turn must be
 * rendered within a `CaptiveContextMenu.Container`.
 *
 * `onInvoke()` — function to call when the item is invoked, which can
 * be by clicking on or by pressing the "Enter" key or "Space" key.
 * */
const DropdownItem: React.FC<PropsWithChildren<DropdownItemProps>> = ({
  onInvoke,
  children,
  ...rest
}) => {
  const ctx = useNonNullContext(Context);

  function invokeCloseFinish(evt: Event) {
    if (rest.disabled) {
      return;
    }

    onInvoke();
    ctx.setShow(false);
    evt.stopPropagation();
  }

  const onClick: MouseEventHandler = (evt) => {
    if (evt.type === "keydown") {
      // Ignore synthetic click event from keyboard event; we handle
      // that ourselves above.
      return;
    }

    invokeCloseFinish(evt.nativeEvent);
  };

  const onKeyDown: KeyboardEventHandler = (evt) => {
    if (evt.key === " " || evt.key === "Enter") {
      invokeCloseFinish(evt.nativeEvent);
      evt.preventDefault(); // Otherwise return on Rename reloads page?
    }
  };

  return (
    <Dropdown.Item
      data-ccm-container={ctx.ccMenuId}
      onClick={onClick}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {children}
    </Dropdown.Item>
  );
};

////////////////////////////////////////////////////////////////////////

export const CaptiveContextMenu = {
  Container,
  DropdownMenu,
  DropdownItem,
};
