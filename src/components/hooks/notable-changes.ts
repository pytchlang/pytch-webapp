import {
  NotableChange,
  NotableChangeKind,
  NotableChangeOfKind,
  NotableChangesManagerOps,
  eqNotableChangeArrays,
} from "../../model/notable-changes";
import { useStoreState } from "../../store";

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
