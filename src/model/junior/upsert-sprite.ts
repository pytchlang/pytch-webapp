import { Action } from "easy-peasy";
import { IPytchAppModel, PytchAppModelActions } from "..";
import {
  NameValidity,
  nameValidity,
  unusedSpriteName,
} from "./structured-program/name-validity";
import { assertNever } from "../../utils";
import {
  SpriteUpsertionAction,
  SpriteUpsertionArgs,
} from "./structured-program/program";
import {
  AsyncUserFlowOptions,
  asyncUserFlowSlice,
  AsyncUserFlowSlice,
  runStateAction,
} from "../user-interactions/async-user-flow";

type UpsertSpriteRunArgs = {
  upsertionAction: SpriteUpsertionAction;
  existingNames: Array<string>;
};

type UpsertSpriteRunState = UpsertSpriteRunArgs & {
  name: string;
  nameValidity: NameValidity;
};

type UpsertSpriteBase = AsyncUserFlowSlice<
  IPytchAppModel,
  UpsertSpriteRunArgs,
  UpsertSpriteRunState
>;

type SAction<ArgT> = Action<UpsertSpriteBase, ArgT>;

type UpsertSpriteActions = {
  setName: SAction<string>;
};

export type UpsertSpriteFlow = UpsertSpriteBase & UpsertSpriteActions;

async function prepare(
  args: UpsertSpriteRunArgs
): Promise<UpsertSpriteRunState> {
  // Assigned in each arm of the switch() below:
  let name: string;
  let existingNames: Array<string>;
  switch (args.upsertionAction.kind) {
    case "insert":
      existingNames = args.existingNames;
      name = unusedSpriteName(existingNames);
      break;
    case "update": {
      // We don't want the dialog to chide the user about "there's
      // already a sprite with that name" when they haven't changed
      // the default yet, so pretend the current name is not one of
      // the existing names.  We separately catch the case that they
      // haven't changed the default in isSubmittable() below.
      const previousName = args.upsertionAction.previousName;
      existingNames = args.existingNames.filter((n) => n !== previousName);
      name = previousName;
      break;
    }
    default:
      // Control-flow analysis re whether existingNames and name are
      // assigned requires the "throw".
      throw assertNever(args.upsertionAction);
  }

  return {
    upsertionAction: args.upsertionAction,
    existingNames,
    name,
    nameValidity: nameValidity(existingNames, name),
  };
}

function isSubmittable(runState: UpsertSpriteRunState): boolean {
  const renamingButUnchanged =
    runState.upsertionAction.kind === "update" &&
    runState.name === runState.upsertionAction.previousName;

  return runState.nameValidity.status === "valid" && !renamingButUnchanged;
}

async function attempt(
  runState: UpsertSpriteRunState,
  actions: PytchAppModelActions
): Promise<void> {
  const upsertionArgs: SpriteUpsertionArgs = {
    ...runState.upsertionAction,
    name: runState.name,
  };

  // This can throw if name already exists, even though we've tried to
  // not let that happen:
  const spriteId = actions.activeProject.upsertSprite(upsertionArgs);

  // The aim here is to activate a newly-added Sprite, but it does no harm
  // to always setActiveActor(), because for a rename, that Sprite was
  // active anyway.
  actions.jrEditState.setActiveActor(spriteId);
}

export let upsertSpriteFlow: UpsertSpriteFlow = (() => {
  const specificSlice: UpsertSpriteActions = {
    setName: runStateAction((state, name) => {
      state.name = name;
      state.nameValidity = nameValidity(state.existingNames, name);
    }),
  };

  const flowOptions: AsyncUserFlowOptions = { pulseSuccessMessage: false };

  return asyncUserFlowSlice(
    specificSlice,
    prepare,
    isSubmittable,
    attempt,
    flowOptions
  );
})();
