import { State, Actions } from "easy-peasy";
import { PytchProgramOps } from "../../model/pytch-program";
import { useStoreActions, useStoreState } from "../../store";

import { EditState } from "../../model/junior/edit-state";
import { StructuredProgram } from "../../model/junior/structured-program";

export const useStructuredProgram = () =>
  useStoreState(
    (state) =>
      PytchProgramOps.ensureKind(
        "ActorsList()",
        state.activeProject.project.program,
        "per-method"
      ).program
  );

type JrEditStateMapper<R> = (state: State<EditState>) => R;
type JrEditActionsMapper<R> = (actions: Actions<EditState>) => R;

/** Like `useStoreState()`, but just within the top-level `jrEditState`
 * model slice.  The given `mapState` function is passed
 * `state.jrEditState` rather than the top-level `state`. */
export function useJrEditState<R>(mapState: JrEditStateMapper<R>): R {
  return useStoreState((state) => mapState(state.jrEditState));
}

/** Like `useStoreActions()`, but just within the top-level
 * `jrEditState` model slice.  The given `mapActions` function is passed
 * `actions.jrEditState` rather than the top-level `actions`. */
export function useJrEditActions<R>(mapActions: JrEditActionsMapper<R>): R {
  return useStoreActions((actions) => mapActions(actions.jrEditState));
}

type JrProgramMapper<R> = (program: StructuredProgram) => R;
export function useMappedProgram<R>(
  label: string,
  mapProgram: JrProgramMapper<R>,
  equalityFn?: (prev: R, next: R) => boolean
) {
  return useStoreState((state) => {
    const program = PytchProgramOps.ensureKind(
      label,
      state.activeProject.project.program,
      "per-method"
    );
    return mapProgram(program.program);
  }, equalityFn);
}
