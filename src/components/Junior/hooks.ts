import { State, Actions } from "easy-peasy";
import { PytchProgramOps } from "../../model/pytch-program";
import { useStoreActions, useStoreState } from "../../store";
import { useDrag, useDrop } from "react-dnd";

import { IPytchAppModel } from "../../model";
import { EditState } from "../../model/junior/edit-state";
import {
  ActorKind,
  ActorNub,
  ActorNubOps,
  AssetMetaDataOps,
  AssetMimeType,
  EventDescriptor,
  HandlerUpsertionOperation,
  StructuredProgram,
  StructuredProgramOps,
  Uuid,
} from "../../model/junior/structured-program";
import { useFocusContext } from "../hooks/focus-steering";
import { assertNever } from "../../utils";

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

export const useStructuredProgram = (label: string) =>
  useMappedProgram(label, (program) => program);

export const activeActorKindSelector = (state: State<IPytchAppModel>) => {
  const program = state.activeProject.project.program;
  const programKind = program.kind;
  if (programKind !== "per-method") {
    throw new Error("useActiveActorKind(): expecting per-method program");
  }

  const activeActorId = state.jrEditState.activeActor;
  const activeActor = StructuredProgramOps.uniqueActorById(
    program.program,
    activeActorId
  );

  return activeActor.kind;
};

export const useActiveActorKind = () => useStoreState(activeActorKindSelector);

export const useActorNubs = () => {
  const mapProgram: JrProgramMapper<Array<ActorNub>> = (program) =>
    program.actors.map((a) => ({ id: a.id, kind: a.kind, name: a.name }));

  return useMappedProgram("useActorNubs()", mapProgram, ActorNubOps.eqArrays);
};

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
// Helpers for reordering AssetCards.

type AssetCardDragItem = { fullPathname: string };

type AssetCardDragProps = { isDragging: boolean };
export const useAssetCardDrag = (fullPathname: string, allowed: boolean) => {
  return useDrag<AssetCardDragItem, void, AssetCardDragProps>(() => ({
    canDrag: allowed,
    type: "jr-asset-card",
    item: { fullPathname },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));
};

type AssetCardDropProps = { hasDragItemOver: boolean };
export const useAssetCardDrop = (fullPathname: string, allowed: boolean) => {
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const reorderAssets = useStoreActions(
    (actions) => actions.activeProject.reorderAssetsAndSync
  );

  return useDrop<AssetCardDragItem, void, AssetCardDropProps>(() => ({
    accept: "jr-asset-card",
    canDrop: (item) => allowed && item.fullPathname !== fullPathname,
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

export type AssetCardSwapWithAdjacentFuns = {
  swapWithPrev: (() => void) | null;
  swapWithNext: (() => void) | null;
} | null;
export const useAssetCardSwapWithAdjacent = (
  assetKind: AssetMimeType,
  reorderingAllowed: boolean,
  movingAssetName: string,
  prevPathname: string | undefined,
  nextPathname: string | undefined
): AssetCardSwapWithAdjacentFuns => {
  const focusContext = useFocusContext();
  const projectId = useStoreState((state) => state.activeProject.project.id);
  const reorderAssets = useStoreActions(
    (actions) => actions.activeProject.reorderAssetsAndSync
  );

  if (!reorderingAllowed) {
    return null;
  }

  // This is too tightly coupled.  We rely on the fact that reordering
  // is allowed for both asset-kinds when in a "per-method" project, and
  // no reordering is allowed for "flat".  So if we get to this point,
  // we know the various pathnames refer to per-method assets and that
  // we are in the per-method IDE.

  const actorId = AssetMetaDataOps.actorId(movingAssetName);
  const focusKeyTail = assetKind === "audio" ? "sounds" : "appearances";
  const groupedFocusKey = `ActorProperties/${actorId}/${focusKeyTail}`;

  const reorderFun = (targetAssetName: string | undefined, offset: number) =>
    targetAssetName == null
      ? null
      : async () => {
          await reorderAssets({ projectId, movingAssetName, targetAssetName });
          focusContext.focusOffsetItem(groupedFocusKey, offset);
        };

  const swapWithPrev = reorderFun(prevPathname, -1);
  const swapWithNext = reorderFun(nextPathname, 1);

  return { swapWithPrev, swapWithNext };
};

////////////////////////////////////////////////////////////////////////////////
// Helpers for drag/drop of hat blocks from help sidebar.

type HelpHatBlockDragItem = { eventDescriptor?: EventDescriptor };
type HelpHatBlockDragProps = { isDragging: boolean };
type HelpHatBlockDropProps = { hasDragItemOver: boolean };

export const useHelpHatBlockDrag = (eventDescriptor?: EventDescriptor) => {
  const setScriptDragInProgress = useJrEditActions(
    (a) => a.setScriptDragInProgress
  );
  return useDrag<HelpHatBlockDragItem, void, HelpHatBlockDragProps>(
    () => ({
      canDrag: eventDescriptor != null,
      type: "help-hat-block",
      item: () => {
        setScriptDragInProgress(true);
        return { eventDescriptor };
      },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
      end: () => {
        setScriptDragInProgress(false);
      },
    }),
    [eventDescriptor, setScriptDragInProgress]
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

////////////////////////////////////////////////////////////////////////////////

export const useLaunchUpsertHatBlockFlow = (
  actorKind: ActorKind,
  operation: HandlerUpsertionOperation
) => {
  const focusContext = useFocusContext("per-method");
  const launchUpsertAction = useJrEditActions((a) => a.upsertHatBlockFlow.run);

  return () => {
    // Send focus to the bookmarked hat-block when the modal renders.
    const modalFocusGroupKey = `UpsertHandlerModal/${actorKind}`;
    focusContext.setPendingGroupFocusKey(modalFocusGroupKey);

    const onDispose = (() => {
      switch (operation.action.kind) {
        case "insert":
          return focusContext.onDisposeAddScript();
        case "update":
          return focusContext.onDisposeChangeHatBlock;
        default:
          return assertNever(operation.action);
      }
    })();

    launchUpsertAction({ operation, actorKind, onDispose });
  };
};
