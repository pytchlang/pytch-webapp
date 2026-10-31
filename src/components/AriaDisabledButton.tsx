import React, { ComponentProps } from "react";

/** A `<button>` marked `aria-disabled`, for use as the `as` prop of a
 * `Dropdown.Item` which is unavailable but should remain reachable by
 * keyboard.  We cannot pass `aria-disabled` to `Dropdown.Item` itself,
 * because it overrides that prop with its own value, computed from its
 * `disabled` prop.  And we cannot use `disabled`, because then
 * react-bootstrap's keyboard navigation skips the item. */
export const AriaDisabledButton: React.FC<ComponentProps<"button">> = (
  props
) => <button {...props} aria-disabled={true} />;
