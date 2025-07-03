import { PropsWithChildren } from "react";
import { useFocusContext } from "./hooks/focus-steering";
import {
  ContainerRefCallbackOptions,
  kFocusGroupContainerClassName,
} from "../model/junior/grouped-focus";
import classNames from "classnames";

type FocusGroupContainerProps = {
  groupedFocusKey: string;
  className?: string;
  opts?: ContainerRefCallbackOptions;
};
export const FocusGroupContainer: React.FC<
  PropsWithChildren<FocusGroupContainerProps>
> = ({ groupedFocusKey, className, opts, children }) => {
  const focusContext = useFocusContext();
  return (
    <div
      ref={focusContext.groupContainerRefCallback(opts)}
      className={classNames(kFocusGroupContainerClassName, className)}
      data-grouped-focus-key={groupedFocusKey}
    >
      {children}
    </div>
  );
};
