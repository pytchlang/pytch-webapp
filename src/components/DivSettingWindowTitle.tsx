import React, { PropsWithChildren, useEffect } from "react";

type DivSettingWindowTitleProps = PropsWithChildren<{
  className?: string;
  windowTitle: string;
}>;

export const DivSettingWindowTitle: React.FC<DivSettingWindowTitleProps> = ({
  className,
  windowTitle: setWindowTitle,
  children,
  ...restProps // Accept and pass through data-* attributes
}) => {
  // TODO: Assert that restProps only contains data-* keys.
  useEffect(() => {
    document.title = setWindowTitle;
  });
  return (
    <div className={className} {...restProps}>
      {children}
    </div>
  );
};
