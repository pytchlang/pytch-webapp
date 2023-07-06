import React, { ReactNode } from "react";
import { withinApp } from "../utils";

interface LinkProps {
  to: string;
  children: ReactNode;
  absolute?: boolean;
}

export const Link = ({ to, children, absolute, ...props }: LinkProps) => {
  if (!absolute) {
    to = withinApp(to);
  }
  return (
    <ReachRouterLink {...props} to={to}>
      {children}
    </ReachRouterLink>
  );
};

export default Link;
