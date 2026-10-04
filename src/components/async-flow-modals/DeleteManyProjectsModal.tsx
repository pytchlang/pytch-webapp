import { useTranslation } from "react-i18next";
import { useFlowState } from "../../model";
import { GenericConfirmActionModal } from "./GenericConfirmActionModal";
import { asyncFlowModal } from "./utils";

export const DeleteManyProjectsModal = () => {
  const { t } = useTranslation("projects");
  const { fsmState } = useFlowState((f) => f.deleteManyProjectsFlow);
  return asyncFlowModal(fsmState, (activeFsmState) => {
    const { ids } = activeFsmState.runState;
    const nProjects = ids.length;
    return (
      <GenericConfirmActionModal
        activeFsmState={activeFsmState}
        headerContent={<p>{t("delete-many.header", { count: nProjects })}</p>}
        bodyContent={<p>{t("delete-many.confirm", { count: nProjects })}</p>}
      />
    );
  });
};
