import React from "react";
import {
  InteractingOrAttemptingAsyncUserFlowFsmState,
  settleFunctions,
} from "../../model/user-interactions/async-user-flow";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { useTranslation } from "react-i18next";
import { ButtonVariant } from "react-bootstrap/esm/types";
import { assertNever } from "../../utils";

type ActionOrBusyButtonProps<RunStateT> = {
  flowState: InteractingOrAttemptingAsyncUserFlowFsmState<RunStateT>;
  isSubmittable: boolean;
  interactingLabel: string;
  variant?: ButtonVariant;
};
export function ActionOrBusyButton<RunStateT>({
  flowState,
  isSubmittable,
  interactingLabel,
  variant,
}: ActionOrBusyButtonProps<RunStateT>): React.ReactNode {
  const { t } = useTranslation("common");

  switch (flowState.kind) {
    case "attempting":
      return (
        <Button
          as="div"
          aria-label={t("working.title")}
          role="status"
          className="ActionOrBusyButton"
          disabled={true}
          variant="primary"
        >
          <Spinner aria-hidden="true" size="sm" />
        </Button>
      );
    case "interacting": {
      const settle = settleFunctions(isSubmittable, flowState);
      return (
        <Button
          title={interactingLabel}
          className="ActionOrBusyButton"
          disabled={!isSubmittable}
          variant={variant ?? "primary"}
          onClick={settle.submit}
        >
          {interactingLabel}
        </Button>
      );
    }
    default:
      return assertNever(flowState);
  }
}
