import { PytchProgramOps } from "../../model/pytch-program";
import { useStoreState } from "../../store";

export const useStructuredProgram = () =>
  useStoreState(
    (state) =>
      PytchProgramOps.ensureKind(
        "ActorsList()",
        state.activeProject.project.program,
        "per-method"
      ).program
  );
