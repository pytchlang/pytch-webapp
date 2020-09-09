import React, { ReactNode } from "react";
import { Link as ReachRouterLink } from "@reach/router";

interface LinkProps {
  to: string;
  children: ReactNode;
  absolute?: boolean;
}

export const Link = ({ to, children, absolute, ...props }: LinkProps) => {
  if (!absolute && to[0] === "/") {
    to = process.env.PUBLIC_URL + to;
  }
  return (
    <ReachRouterLink {...props} to={to}>
      {children}
    </ReachRouterLink>
  );
};

export default Link;
