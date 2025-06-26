import {
  KeyedNotableChange,
  NotableChange,
  NotableChangeKind,
  NotableChangeOfKind,
  NotableChangesManagerOps,
  eqKeyedNotableChangeArrays,
  eqNotableChangeArrays,
} from "../../model/notable-changes";
import { useStoreActions, useStoreState } from "../../store";

export function useNotableChanges<KindT extends NotableChangeKind>(
  kind: KindT,
  select?: (change: NotableChangeOfKind<KindT>) => boolean
): Array<NotableChange> {
  return useStoreState((state) => {
    const allChangesOfKind = NotableChangesManagerOps.changesOfKind(
      state.activeProject.changesManager,
      kind
    );
    return allChangesOfKind.filter(select ?? (() => true));
  }, eqNotableChangeArrays);
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
