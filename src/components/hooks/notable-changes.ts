import { Uuid } from "../../model/junior/structured-program";
import {
  KeyedNotableChange,
  eqKeyedNotableChangeArrays,
} from "../../model/notable-changes";
import { useStoreActions, useStoreState } from "../../store";

export function useScriptJustUpserted(handlerId: Uuid): boolean {
  return useStoreState((state) =>
    state.activeProject.changesManager.keyedChanges.some((keyedChange) => {
      const change = keyedChange.change;
      return change.kind === "script-changed" && change.handlerId === handlerId;
    })
  );
}

export function useSomeScriptJustAdded(): boolean {
  return useStoreState((state) =>
    state.activeProject.changesManager.keyedChanges.some((keyedChange) => {
      const change = keyedChange.change;
      return (
        change.kind === "script-changed" &&
        (change.scriptChangedKind === "insert" ||
          change.scriptChangedKind === "duplicate")
      );
    })
  );
}

export function useActiveNotableChanges(): Array<KeyedNotableChange> {
  return useStoreState(
    (state) =>
      state.activeProject.changesManager.keyedChanges.filter(
        (change) => change.isActive
      ),
    eqKeyedNotableChangeArrays
  );
}

export function useDeactivateChangeAction() {
  return useStoreActions((actions) => actions.activeProject._deactivateChange);
}
