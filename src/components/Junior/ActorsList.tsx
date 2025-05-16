import React, { useContext } from "react";
import classNames from "classnames";
import {
  AssetMetaDataOps,
  ActorKind,
  StructuredProgramOps,
  Uuid,
  ActorKindOps,
} from "../../model/junior/structured-program";
import { useStoreState } from "../../store";
import { AssetImageThumbnail } from "../AssetImageThumbnail";
import { AddSomethingSingleButton } from "./AddSomethingButton";
import {
  seizeFocusRequest,
  useJrEditActions,
  useJrEditState,
  useMappedProgram,
  useStructuredProgram,
} from "./hooks";
import { Dropdown } from "react-bootstrap";
import { ActorPropertiesTabKey } from "../../model/junior/edit-state";
import { SingleTab } from "../SingleTab";
import { CaptiveContextMenu } from "../CaptiveContextMenu";
import { RunOutcome } from "../../model/user-interactions/async-user-flow";
import { assertNever } from "../../utils";
import { ListOfThings } from "../ListOfThings";
import {
  containerRefCallback,
  focusGroupContainerClass,
} from "../../model/junior/grouped-focus";

type ActorThumbnailProps = { id: Uuid };
const ActorThumbnail: React.FC<ActorThumbnailProps> = ({ id }) => {
  const maybeFirstImage = useStoreState((state) =>
    AssetMetaDataOps.firstMatching(
      state.activeProject.project.assets,
      id,
      "image"
    )
  );

  const wrap = (content: JSX.Element) => (
    <div className="thumbnail">{content}</div>
  );

  if (maybeFirstImage == null) {
    return wrap(<div className="asset-preview">[No costumes]</div>);
  }

  if (maybeFirstImage.presentation.kind !== "image") {
    throw new Error(
      "expecting an image but presentation is of kind " +
        `"${maybeFirstImage.presentation.kind}"`
    );
  }

  return wrap(
    <AssetImageThumbnail
      image={maybeFirstImage.presentation.image}
      maxSize={60}
    />
  );
};

type RenameSpriteDropdownItemProps = {
  isAllowed: boolean;
  actorId: Uuid;
  previousName: string;
};
const RenameSpriteDropdownItem: React.FC<RenameSpriteDropdownItemProps> = ({
  isAllowed,
  actorId,
  previousName,
}) => {
  const runUpsertFlow = useJrEditActions((a) => a.upsertSpriteFlow.run);
  const existingNames = useMappedProgram(
    "RenameSpriteDropdownItem",
    (program) => StructuredProgramOps.spriteNames(program)
  );
  const doRename = () =>
    runUpsertFlow({
      upsertionAction: { kind: "update", actorId, previousName },
      existingNames,
    });

  return (
    <CaptiveContextMenu.DropdownItem onInvoke={doRename} disabled={!isAllowed}>
      Rename
    </CaptiveContextMenu.DropdownItem>
  );
};

type ActorCardDropdownProps = {
  kind: ActorKind;
  name: string;
  id: Uuid;
};
const ActorCardDropdown: React.FC<ActorCardDropdownProps> = ({
  kind,
  name,
  id,
}) => {
  const runDeleteActor = useJrEditActions((a) => a.deleteSpriteFlow.run);
  const activateTab = useJrEditActions((a) => a.setActorPropertiesActiveTab);
  const setFocusedActorAction = useJrEditActions((a) => a.setFocusedActor);
  const captiveMenuContext = useContext(CaptiveContextMenu.Context);

  const activateThisActor = () => setFocusedActorAction(id);

  // You can only rename/delete sprites, not the stage.
  const canRenameOrDelete = kind === "sprite";

  const tryFocusContainer =
    captiveMenuContext == null
      ? () => void 0
      : captiveMenuContext.focusContainer;

  const onDeleteDispose = (outcome: RunOutcome) => {
    switch (outcome) {
      case "error":
      case "abandoned-by-navigation":
        // Nothing sensible we can do here.
        break;

      case "cancelled-by-user":
        // Actor was not deleted after all, so re-focus its card.
        console.log("delete cxld; focusing card");
        tryFocusContainer();
        break;

      case "succeeded":
        // TODO: Focus the actor which was just after the deleted actor
        // (if there is one), or the one which was just before (if there
        // is one).  We should never be able to delete the last actor
        // because the stage cannot be deleted.
        console.log("TODO!  Focus an adjacent actor");
        break;

      default:
        assertNever(outcome);
    }
  };

  // TODO: Add undo functionality for "delete sprite" action.
  const doDelete = () => {
    if (!canRenameOrDelete) {
      console.warn("ActorCardDropdown.doDelete(): should not be running");
      return;
    }

    runDeleteActor({
      spriteDisplayName: name,
      actorId: id,
      onDispose: onDeleteDispose,
    });
  };

  const appearancesName = ActorKindOps.names(kind).appearancesDisplay;
  const onClickProps = (tab: ActorPropertiesTabKey) => ({
    onInvoke() {
      // EXPERIMENT:
      if (tab === "appearances") {
        console.log("Setting focus req");
        seizeFocusRequest.set({ key: "AppearancesList-Item", index: 0 });
        console.log("Set focus req");
      }

      // For mouse usage, clicking on the dropdown toggle will have
      // already activated this actor, but for keyboard navigation, the
      // user might not have explicitly activated this actor before
      // launching the dropdown and choosing code/costumes/sounds.
      activateThisActor();
      activateTab(tab);
    },
  });

  return (
    <CaptiveContextMenu.DropdownMenu>
      <CaptiveContextMenu.DropdownItem {...onClickProps("code")}>
        Go to code
      </CaptiveContextMenu.DropdownItem>
      <CaptiveContextMenu.DropdownItem {...onClickProps("appearances")}>
        Go to {appearancesName}
      </CaptiveContextMenu.DropdownItem>
      <CaptiveContextMenu.DropdownItem {...onClickProps("sounds")}>
        Go to sounds
      </CaptiveContextMenu.DropdownItem>
      <Dropdown.Divider />
      <RenameSpriteDropdownItem
        actorId={id}
        isAllowed={canRenameOrDelete}
        previousName={name}
      />
      <CaptiveContextMenu.DropdownItem
        className="danger"
        onInvoke={doDelete}
        disabled={!canRenameOrDelete}
      >
        DELETE
      </CaptiveContextMenu.DropdownItem>
    </CaptiveContextMenu.DropdownMenu>
  );
};

type ActorCardProps = {
  isFocused: boolean;
  isGlobalSteerFocusTarget: boolean;
  kind: ActorKind;
  id: Uuid;
  name: string;
};
const ActorCard: React.FC<ActorCardProps> = ({
  isFocused,
  isGlobalSteerFocusTarget,
  kind,
  id,
  name,
}) => {
  const setFocusedActorAction = useJrEditActions((a) => a.setFocusedActor);
  const setFocusedActor = () => setFocusedActorAction(id);

  const containerClass = isGlobalSteerFocusTarget ? "gfs__actors" : undefined;
  const className = classNames("ActorCard", `kind-${kind}`, { isFocused });
  return (
    <CaptiveContextMenu.Container className={containerClass}>
      <div className={className} onClick={setFocusedActor} data-actor-id={id}>
        <div className="ActorCardContent">
          <ActorThumbnail id={id} />
          <div className="label">{name}</div>
        </div>
        <ActorCardDropdown kind={kind} name={name} id={id} />
      </div>
    </CaptiveContextMenu.Container>
  );
};

export const ActorsList = () => {
  const program = useStructuredProgram("ActorsList()");
  const focusedActor = useJrEditState((s) => s.focusedActor);
  const runUpsertFlow = useJrEditActions((a) => a.upsertSpriteFlow.run);
  const setFocusedActorAction = useJrEditActions((a) => a.setFocusedActor);

  const existingNames = StructuredProgramOps.spriteNames(program);
  const launchAddSpriteModal = () => {
    runUpsertFlow({
      upsertionAction: { kind: "insert" },
      existingNames,
    });
  };

  const ariaLabel = "Stage, sprites";

  return (
    <section
      className="Junior-ActorsList-container compact-tablist-container"
      aria-label={ariaLabel}
    >
      <SingleTab title="Stage and sprites">
        <div className="abs-0000">
          <div
            ref={containerRefCallback()}
            className={focusGroupContainerClass("gfs__actors__container")}
            data-grouped-focus-key="ActorsList"
          >
            <ol className="ActorsList">
              {program.actors.map((a, actorIdx) => {
                // TODO: This should be "isActive" not "focused".
                const isFocused = a.id === focusedActor;
                const activateActor = () => setFocusedActorAction(a.id);
                return (
                  <ListOfThings.Item
                    key={a.id}
                    className="Item-ActorCard"
                    onActivate={activateActor}
                    nonFocusable
                  >
                    <ActorCard
                      isFocused={isFocused}
                      isGlobalSteerFocusTarget={actorIdx === 0}
                      kind={a.kind}
                      id={a.id}
                      name={a.name}
                    />
                  </ListOfThings.Item>
                );
              })}
            </ol>
            <AddSomethingSingleButton
              what="sprite"
              label="Add sprite"
              onClick={() => launchAddSpriteModal()}
            />
          </div>
        </div>
      </SingleTab>
    </section>
  );
};
