import { action, Action, thunk, Thunk } from "easy-peasy";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { ICopyProjectDescriptor, ProjectId } from "../projects";
import { IPytchAppModel, PytchAppModelActions } from "..";
import { navigate } from "@reach/router";
import { withinApp } from "../../utils";

type ICopyProjectBase = IModalUserInteraction<ICopyProjectDescriptor>;

interface ICopyProjectSpecific {
  sourceProjectId: ProjectId;
  setSourceProjectId: Action<ICopyProjectSpecific, ProjectId>;
  nameOfCopy: string;
  setNameOfCopy: Action<ICopyProjectSpecific, string>;
  refreshInputsReady: Thunk<ICopyProjectBase & ICopyProjectSpecific>;

  // Slight fudge to use ICopyProjectDescriptor as the payload type
  // for launch(), but its properties are of the correct type.
  launch: Thunk<
    ICopyProjectBase & ICopyProjectSpecific,
    ICopyProjectDescriptor,
    any,
    IPytchAppModel
  >;
}

const attemptSaveCopy = async (
  actions: PytchAppModelActions,
  descriptor: ICopyProjectDescriptor
) => {
  const requestCopyProjectThenResync =
    actions.projectCollection.requestCopyProjectThenResync;

  const newId = await requestCopyProjectThenResync(descriptor);
  await navigate(withinApp(`/ide/${newId}`), { replace: true });
};

const copyProjectSpecific: ICopyProjectSpecific = {
  sourceProjectId: -1,
  setSourceProjectId: action((state, sourceProjectId) => {
    state.sourceProjectId = sourceProjectId;
  }),
  nameOfCopy: "",
  setNameOfCopy: action((state, nameOfCopy) => {
    state.nameOfCopy = nameOfCopy;
  }),

  refreshInputsReady: thunk((actions, _payload, helpers) => {
    const state = helpers.getState();
    actions.setInputsReady(state.nameOfCopy !== "");
  }),

  launch: thunk(async (actions, payload, helpers) => {
    // Save project before making copy.
    await helpers.getStoreActions().activeProject.requestSyncToStorage();

    // We use the payload's "nameOfCopy" property not quite as its name
    // suggests; we use it to mean "the name of the source project".
    actions.superLaunch();
    actions.setSourceProjectId(payload.sourceProjectId);
    const suggestedCopyName = `Copy of ${payload.nameOfCopy}`;
    actions.setNameOfCopy(suggestedCopyName);
    actions.setInputsReady(true);
  }),
};

export type ICopyProjectInteraction = ICopyProjectBase & ICopyProjectSpecific;

export const copyProjectInteraction = modalUserInteraction(
  attemptSaveCopy,
  copyProjectSpecific
);
