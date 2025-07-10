import {
  ActiveAsyncUserFlowFsmState,
  AsyncUserFlowFsmState,
} from "../../model/user-interactions/async-user-flow";
import { GenericErrorModal } from "./GenericErrorModal";
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
  } else if (fsmState.kind === "awaiting-ack-of-error") {
    return (
      <GenericErrorModal
        message={fsmState.errorMessage}
        onAck={fsmState.userAck}
      />
    );
  } else {
    return contentFun(fsmState);
  }
}
