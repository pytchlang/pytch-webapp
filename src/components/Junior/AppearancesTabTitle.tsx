import React from "react";
import classNames from "classnames";
import { ActorKind } from "../../model/junior/structured-program";
import { useTranslation } from "react-i18next";
import { kActorKindValues } from "../../model/junior/structured-program/actor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Ensure that the "Backdrops" or "Costumes" tab is always the same
// width.  Otherwise we get an annoying jitter as you switch between the
// stage and a sprite.

type AppearancesTabTitleProps = {
  actorKind: ActorKind;
};
export const AppearancesTabTitle: React.FC<AppearancesTabTitleProps> = ({
  actorKind,
}) => {
  const { t } = useTranslation("ide");

  const content = kActorKindValues.map((ak) => (
    <span
      key={ak}
      className={classNames("title-option me-1", { isActive: ak === actorKind })}
    >
        <FontAwesomeIcon icon={"brush"} className={"me-1"} />
        {t(`per-method.tab-title.actor-properties.appearances.${ak}`)}
    </span>
  ));

  return <div className="AppearancesTabTitle">{content}</div>;
};
