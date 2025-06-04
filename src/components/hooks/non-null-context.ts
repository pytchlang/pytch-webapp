import { Context, useContext } from "react";
import { failIfNull } from "../../utils";

export function useNonNullContext<ContextT>(
  context: Context<ContextT | null>
): ContextT {
  return failIfNull(useContext<ContextT | null>(context), "no context");
}
