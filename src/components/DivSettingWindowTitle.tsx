import React, { PropsWithChildren, useEffect } from "react";

type DivSettingWindowTitleProps = PropsWithChildren<{
  className?: string;
  windowTitle: string;
}>;

export const DivSettingWindowTitle: React.FC<DivSettingWindowTitleProps> = ({
  className,
  windowTitle: setWindowTitle,
  children,
}) => {
  useEffect(() => {
    document.title = setWindowTitle;
  });
  return <div className={className}>{children}</div>;
};
