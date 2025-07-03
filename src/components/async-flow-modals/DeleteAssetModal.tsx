import { useFlowState } from "../../model";
import { GenericConfirmActionModal } from "./GenericConfirmActionModal";
import { asyncFlowModal } from "./utils";

export const DeleteAssetModal = () => {
  const { fsmState } = useFlowState((f) => f.deleteAssetFlow);
  return asyncFlowModal(fsmState, (activeFsmState) => {
    const { displayName, operationContext } = activeFsmState.runState;
    const kindDisplayName = operationContext.assetDefinite;
    const scopeDisplayName = operationContext.scope;

    return (
      <GenericConfirmActionModal
        activeFsmState={activeFsmState}
        headerContent={
          <p>
            Delete {kindDisplayName} “{displayName}” from {scopeDisplayName}?
          </p>
        }
        bodyContent={
          <p>
            Are you sure you want to delete the {kindDisplayName} “{displayName}
            ” from {scopeDisplayName}?
          </p>
        }
      />
    );
  });
};
