import React from "react";
import Button from "react-bootstrap/Button";
import classNames from "classnames";
import {
  KeyDescriptor,
} from "../../model/junior/keyboard-layout";

type KeyOptionProps = {
  descriptor: KeyDescriptor;
  selectedKey: KeyDescriptor;
  onClick(): void;
};
const KeyOption: React.FC<KeyOptionProps> = ({
  descriptor,
  selectedKey,
  onClick,
}) => {
  const { browserKeyName, displayName } = descriptor;
  const isSelected = browserKeyName === selectedKey.browserKeyName;

  // Ugly hack to get wide spacebar:
  const classes = classNames("KeyOption", {
    isSelected,
    spacebar: browserKeyName === " ",
  });

  return (
    <Button variant="secondary" className={classes} onClick={onClick}>
      <span>{displayName}</span>
    </Button>
  );
};
