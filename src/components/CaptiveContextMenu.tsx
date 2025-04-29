import React, {
  createContext,
  FocusEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  PropsWithChildren,
  KeyboardEvent as ReactKeyboardEvent,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Dropdown } from "react-bootstrap";

type ContextT = {
  divRef: React.MutableRefObject<HTMLDivElement | null>;
  idSuffix: string;
  containerId: string;
  menuId: string;
  show: boolean;
  setShow(show: boolean): void;
  toggleShow(): void;
  focusContainer(): void;
};

const Context = createContext<ContextT | null>(null);

type ContainerProps = {
  onFocus?: FocusEventHandler;
  onBlur?: FocusEventHandler;
  onKeyDown?: KeyboardEventHandler;
};
const Container: React.FC<PropsWithChildren<ContainerProps>> = ({
  onFocus,
  onBlur,
  onKeyDown: callerOnKeyDown,
  children,
}) => {
  const divRef = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState<boolean>(false);
  const idSuffix = useId();
  const containerId = `captive-context-menu-container${idSuffix}`;
  const menuId = `captive-context-menu${idSuffix}`;

  const toggleShow = () => setShow((show) => !show);

  const focusContainer = () => {
    const div = divRef.current;
    if (div == null) return;
    div.focus();
  };

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
    focusContainer();
  };

  const docKeyDown = (evt: KeyboardEvent) => {
    if (evt.key === "Escape") {
      setShow(false);
      focusContainer();
    }
  };

  useEffect(() => {
    if (!show) return;

    document.addEventListener("click", docClick);
    document.addEventListener("keydown", docKeyDown);
    return () => {
      document.removeEventListener("keydown", docKeyDown);
      document.removeEventListener("click", docClick);
    };
  }, [docClick, docKeyDown, show]);

  const itemSelector = `:scope a[data-ccm-container="${idSuffix}"]`;
  useEffect(() => {
    const containerDiv = divRef.current;
    if (containerDiv == null) return;
    const firstItem = containerDiv.querySelector<HTMLElement>(itemSelector);
    firstItem?.focus();
  });

  const containerKeyDown = (evt: ReactKeyboardEvent) => {
    if (callerOnKeyDown) callerOnKeyDown(evt);

    if (evt.key === "F10" && evt.shiftKey) {
      toggleShow();
      evt.preventDefault();
    }

    const containerDiv = divRef.current;
    if (containerDiv == null) return;

    if (evt.key === "Tab") {
      const activeElt = document.activeElement;
      if (activeElt == null) return;
      const allItems = Array.from(containerDiv.querySelectorAll(itemSelector));
      const lastItemIdx = allItems.length - 1;
      const oldActiveIdx = allItems.indexOf(activeElt);
      const movingOut = oldActiveIdx === (evt.shiftKey ? 0 : lastItemIdx);
      if (movingOut) {
        setShow(false);
      }
    }
  };

  const contextValue: ContextT = {
    divRef,
    idSuffix,
    containerId,
    menuId,
    show,
    setShow,
    toggleShow,
    focusContainer,
  };

  return (
    <Context.Provider value={contextValue}>
      <div
        id={containerId}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={divRef}
        role="button"
        tabIndex={0}
        onKeyDown={containerKeyDown}
        aria-haspopup="menu"
        aria-expanded={show}
        aria-controls={menuId}
      >
        {children}
      </div>
    </Context.Provider>
  );
};

////////////////////////////////////////////////////////////////////////

type Props = {
  disabled?: boolean;
  className?: string;
  onInvoke(): void;
};
const DropdownItem: React.FC<PropsWithChildren<Props>> = ({
  onInvoke,
  children,
  ...rest
}) => {
  const ctx = useContext(Context);
  if (ctx == null) throw new Error("no context");

  function invokeCloseFinish(ctx: ContextT, evt: Event) {
    onInvoke();
    ctx.setShow(false);
    evt.stopPropagation();
  }

  const onClick: MouseEventHandler = (evt) => {
    invokeCloseFinish(ctx, evt.nativeEvent);
  };

  const onKeyDown: KeyboardEventHandler = (evt) => {
    if (evt.key === " " || evt.key === "Enter") {
      invokeCloseFinish(ctx, evt.nativeEvent);
      evt.preventDefault(); // Otherwise return on Rename reloads page?
    }
  };

  return (
    <Dropdown.Item
      data-ccm-container={ctx.idSuffix}
      onClick={onClick}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {children}
    </Dropdown.Item>
  );
};

////////////////////////////////////////////////////////////////////////

const DropdownMenu: React.FC<PropsWithChildren<object>> = ({ children }) => {
  const ctx = useContext(Context);
  if (ctx == null) throw new Error("no context");

  const onKeydown: KeyboardEventHandler = (evt) => {
    if (evt.key === "F10" && evt.shiftKey && ctx.show) {
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

export const CaptiveContextMenu = {
  Context,
  Container,
  DropdownMenu,
  DropdownItem,
};
