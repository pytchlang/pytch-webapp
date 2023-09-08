import React from "react";
import classNames from "classnames";

// Ensure that the "Backdrops" or "Costumes" tab is always the same
// width.  Otherwise we get an annoying jitter as you switch between the
// stage and a sprite.

// TODO: Is there a way to compute this?
const allDisplayTitleValues = ["Costumes", "Backdrops"];
// And then use a tighter type for "value" here?
type AppearancesTabTitleProps = {
  value: string;
};
export const AppearancesTabTitle: React.FC<AppearancesTabTitleProps> = ({
  value,
}) => {
  const content = allDisplayTitleValues.map((title) => (
    <span
      key={title}
      className={classNames("title-option", { isActive: title === value })}
    >
      {title}
    </span>
  ));
  return <div className="AppearancesTabTitle">{content}</div>;
};
