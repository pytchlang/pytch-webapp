import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type AddSomethingButtonProps = {
  onClick: React.MouseEventHandler;
};

export const AddSomethingButton: React.FC<AddSomethingButtonProps> = ({
  onClick,
}) => {
  return (
    <div className="AddSomethingButton">
      <div onClick={onClick}>
        <span className="icon">
          <FontAwesomeIcon className="fa-lg" icon="plus" />
        </span>
      </div>
    </div>
  );
};
