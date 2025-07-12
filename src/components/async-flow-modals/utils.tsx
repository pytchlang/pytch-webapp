import {
  ActiveAsyncUserFlowFsmState,
  AsyncUserFlowFsmState,
} from "../../model/user-interactions/async-user-flow";
import { GenericWorkingModal } from "./GenericWorkingModal";

export function asyncFlowModal<RunStateT, AttemptOutcomeNubT>(
  fsmState: AsyncUserFlowFsmState<RunStateT, AttemptOutcomeNubT>,
  contentFun: (
    fsmState: ActiveAsyncUserFlowFsmState<RunStateT, AttemptOutcomeNubT>
  ) => JSX.Element
) {
  if (fsmState.kind === "idle") {
    return null;
  } else if (fsmState.kind === "preparing") {
    return <GenericWorkingModal />;
  } else {
    return contentFun(fsmState);
  }
}
