import React from "react";
import classNames from "classnames";

type DiffViewKind = "bare-old" | "old-diff" | "new-diff";

type DiffViewKindSelectorProps = {
  viewKind: DiffViewKind;
  setViewKind: (kind: DiffViewKind) => void;
};
const DiffViewKindSelector: React.FC<DiffViewKindSelectorProps> = ({
  viewKind,
  setViewKind,
}) => {
  const viewOption = (
    activeViewKind: DiffViewKind,
    thisViewKind: DiffViewKind,
    label: string
  ) => {
    const isActive = activeViewKind === thisViewKind;
    const classes = classNames("DiffViewKindOption", { isActive });
    return (
      <div className={classes} onClick={() => setViewKind(thisViewKind)}>
        <span>{label}</span>
      </div>
    );
  };

  return (
    <div className="DiffViewKindSelector">
      {viewOption(viewKind, "bare-old", "What should my code look like now?")}
      {viewOption(viewKind, "old-diff", "Where should I change my code?")}
      {viewOption(
        viewKind,
        "new-diff",
        "What should my code look like afterwards?"
      )}
    </div>
  );
};
