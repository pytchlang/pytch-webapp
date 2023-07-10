import { Link as ReactRouterLink, LinkProps } from "react-router-dom";
import { pathWithinApp } from "../env-utils";

type Props = LinkProps & { to: string };
export const Link: React.FC<Props> = (props: Props) => {
  const { to: appRelativePath, children, ...rest } = props;
  const to = pathWithinApp(appRelativePath);
  const adaptedProps = { to, ...rest };
  return <ReactRouterLink {...adaptedProps}>{children}</ReactRouterLink>;
};

export default Link;
