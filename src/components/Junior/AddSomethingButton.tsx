import React, { PropsWithChildren, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { ActorKind } from "../../model/junior/structured-program";
import { ListOfThings } from "../ListOfThings";

export type AddSomethingButtonWhat =
  | "sprite"
  | "script"
  | "flat-asset"
  | `${ActorKind}-asset`;

export type AddSomethingButtonProps = {
  what: AddSomethingButtonWhat;
  label: string;
  onClick: React.MouseEventHandler;
};

export const AddSomethingButton: React.FC<AddSomethingButtonProps> = ({
  what,
  label,
  onClick,
}) => {
  const maybeListContainerCtx = useContext(ListOfThings.ContainerContext);

  const dataProps =
    maybeListContainerCtx == null
      ? {}
      : { "data-containing-list-id-nub": maybeListContainerCtx.idNub };

  const classes = classNames("AddSomethingButton", `add-${what}`);
  return (
    <button className={classes} onClick={onClick} {...dataProps}>
      {label && <span className="label">{label}</span>}
      <span className="icon">
        <FontAwesomeIcon className="fa-lg" icon="plus" />
      </span>
    </button>
  );
};

type AddSomethingButtonStripProps = {
  className?: string;
  children: PropsWithChildren<unknown>["children"];
};
export const AddSomethingButtonStrip: React.FC<
  AddSomethingButtonStripProps
> = ({ className, children }) => {
  const classes = classNames(
    "AddSomethingButtonStrip-blur-container",
    className
  );
  return (
    <div className={classes}>
      <div className="AddSomethingButtonStrip-blur" />
      <div className="AddSomethingButtonStrip">{children}</div>
    </div>
  );
};

type AddSomethingSingleButtonProps = AddSomethingButtonProps & {
  className?: string;
};
export const AddSomethingSingleButton: React.FC<
  AddSomethingSingleButtonProps
> = (props) => {
  return (
    <AddSomethingButtonStrip className={props.className}>
      <AddSomethingButton
        what={props.what}
        label={props.label}
        onClick={props.onClick}
      />
    </AddSomethingButtonStrip>
  );
};

type InlineAddSomethingButtonProps = {
  what: AddSomethingButtonWhat;
  label: string;
};
export const InlineAddSomethingButton: React.FC<
  InlineAddSomethingButtonProps
> = ({ what, label }) => {
  const classes = classNames("InlineAddSomethingButton", `add-${what}`);
  return (
    <span className={classes}>
      <span className="label">{label}</span>
      <span className="icon">
        <FontAwesomeIcon icon="plus" />
      </span>
    </span>
  );
};
