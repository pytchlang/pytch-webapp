import React, { PropsWithChildren } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type AddSomethingButtonProps = {
  label?: string;
  onClick: React.MouseEventHandler;
};

export const AddSomethingButton: React.FC<AddSomethingButtonProps> = ({
  label,
  onClick,
}) => {
  return (
    <div className="AddSomethingButton">
      <div onClick={onClick}>
        {label && <span className="label">{label}</span>}
        <span className="icon">
          <FontAwesomeIcon className="fa-lg" icon="plus" />
        </span>
      </div>
    </div>
  );
};

type AddSomethingButtonStripProps = {
  children: PropsWithChildren<unknown>["children"];
};
export const AddSomethingButtonStrip: React.FC<
  AddSomethingButtonStripProps
> = ({ children }) => {
  return <div className="AddSomethingButtonStrip">{children}</div>;
};
