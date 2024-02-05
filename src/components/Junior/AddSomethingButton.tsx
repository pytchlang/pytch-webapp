import React, { PropsWithChildren } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { ActorKind } from "../../model/junior/structured-program";

export type AddSomethingButtonWhat = "sprite" | "script" | `${ActorKind}-asset`;

export type AddSomethingButtonProps = {
  what: AddSomethingButtonWhat;
  label?: string;
  onClick: React.MouseEventHandler;
};

export const AddSomethingButton: React.FC<AddSomethingButtonProps> = ({
  what,
  label,
  onClick,
}) => {
  const classes = classNames("AddSomethingButton", `add-${what}`);
  return (
    <div className={classes} onClick={onClick}>
      {label && <span className="label">{label}</span>}
      <span className="icon">
        <FontAwesomeIcon className="fa-lg" icon="plus" />
      </span>
    </div>
  );
};

type AddSomethingButtonStripProps = {
  children: PropsWithChildren<unknown>["children"];
};
export const AddSomethingButtonStrip: React.FC<
  AddSomethingButtonStripProps
> = ({ children }) => {
  return (
    <div className="AddSomethingButtonStrip-blur-container">
      <div className="AddSomethingButtonStrip-blur" />
      <div className="AddSomethingButtonStrip">{children}</div>
    </div>
  );
};

export const AddSomethingSingleButton: React.FC<AddSomethingButtonProps> = (
  props
) => {
  return (
    <AddSomethingButtonStrip>
      <AddSomethingButton {...props} />
    </AddSomethingButtonStrip>
  );
};

type InlineAddSomethingButtonProps = { label?: string };
export const InlineAddSomethingButton: React.FC<
  InlineAddSomethingButtonProps
> = ({ label }) => {
  const hasLabel = label != null;
  const classes = classNames("InlineAddSomethingButton", { hasLabel });
  return (
    <span className={classes}>
      {label && <span className="label">{label}</span>}
      <span className="icon">
        <FontAwesomeIcon icon="plus" />
      </span>
    </span>
  );
};
