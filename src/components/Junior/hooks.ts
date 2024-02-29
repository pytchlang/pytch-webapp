import { State, Actions } from "easy-peasy";
import { PytchProgramOps } from "../../model/pytch-program";
import { useStoreActions, useStoreState } from "../../store";
import { useDrag, useDrop } from "react-dnd";

import { EditState } from "../../model/junior/edit-state";
import {
  EventDescriptor,
  StructuredProgram,
  Uuid,
} from "../../model/junior/structured-program";

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

////////////////////////////////////////////////////////////////////////////////
// Helpers for drag/drop of Pytch scripts.

type PytchScriptDragItem = { handlerId: Uuid };

type PytchScriptDragProps = { isDragging: boolean };
export const usePytchScriptDrag = (handlerId: Uuid) => {
  const setScriptDragInProgress = useJrEditActions(
    (a) => a.setScriptDragInProgress
  );
  return useDrag<PytchScriptDragItem, void, PytchScriptDragProps>(
    () => ({
      type: "pytch-script",
      item: () => {
        setScriptDragInProgress(true);
        return { handlerId };
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: () => {
        setScriptDragInProgress(false);
      },
    }),
    [setScriptDragInProgress]
  );
};

type PytchScriptDropProps = { hasDragItemOver: boolean };
export const usePytchScriptDrop = (actorId: Uuid, handlerId: Uuid) => {
  const reorderHandlers = useStoreActions(
    (actions) => actions.activeProject.reorderHandlers
  );

  return useDrop<PytchScriptDragItem, void, PytchScriptDropProps>(
    () => ({
      accept: "pytch-script",
      canDrop: (item) => item.handlerId !== handlerId,
      drop: (item) => {
        reorderHandlers({
          actorId,
          movingHandlerId: item.handlerId,
          targetHandlerId: handlerId,
        });
      },
      collect: (monitor) => ({
        hasDragItemOver: monitor.canDrop() && monitor.isOver(),
      }),
    }),
    [reorderHandlers]
  );
};

////////////////////////////////////////////////////////////////////////////////
// Helpers for drag/drop of AssetCards.

type AssetCardDragItem = { fullPathname: string };

type AssetCardDragProps = { isDragging: boolean };
export const useAssetCardDrag = (fullPathname: string) => {
  return useDrag<AssetCardDragItem, void, AssetCardDragProps>(() => ({
    type: "jr-asset-card",
    item: { fullPathname },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));
};

type AssetCardDropProps = { hasDragItemOver: boolean };
export const useAssetCardDrop = (fullPathname: string) => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const reorderAssets = useStoreActions(
    (actions) => actions.activeProject.reorderAssetsAndSync
  );

  return useDrop<AssetCardDragItem, void, AssetCardDropProps>(() => ({
    accept: "jr-asset-card",
    canDrop: (item) => item.fullPathname !== fullPathname,
    drop: (item) => {
      console.log("Dropping!", item);
      reorderAssets({
        projectId,
        movingAssetName: item.fullPathname,
        targetAssetName: fullPathname,
      });
    },
    collect: (monitor) => ({
      hasDragItemOver: monitor.canDrop() && monitor.isOver(),
    }),
  }));
};

////////////////////////////////////////////////////////////////////////////////
// Helpers for drag/drop of hat blocks from help sidebar.

type HelpHatBlockDragItem = { eventDescriptor?: EventDescriptor };
type HelpHatBlockDragProps = { isDragging: boolean };
type HelpHatBlockDropProps = { hasDragItemOver: boolean };

export const useHelpHatBlockDrag = (eventDescriptor?: EventDescriptor) => {
  return useDrag<HelpHatBlockDragItem, void, HelpHatBlockDragProps>(
    () => ({
      canDrag: eventDescriptor != null,
      type: "help-hat-block",
      item: { eventDescriptor },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [eventDescriptor]
  );
};

export const useHelpHatBlockDrop = (actorId: Uuid) => {
  const upsertHandler = useStoreActions(
    (actions) => actions.activeProject.upsertHandler
  );

  return useDrop<HelpHatBlockDragItem, void, HelpHatBlockDropProps>(
    () => ({
      accept: "help-hat-block",
      drop: (item) => {
        const eventDescriptor = item.eventDescriptor;
        if (eventDescriptor == null) return; // Shouldn't happen.
        upsertHandler({ action: { kind: "insert" }, actorId, eventDescriptor });
      },
      collect: (monitor) => ({ hasDragItemOver: monitor.isOver() }),
    }),
    [actorId]
  );
};
