import { action, Action, Actions, thunk, Thunk } from "easy-peasy";
import { IModalUserInteraction, modalUserInteraction } from ".";
import { ICopyProjectDescriptor, ProjectId } from "../projects";
import { IPytchAppModel } from "..";
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
  actions: Actions<IPytchAppModel>,
  descriptor: ICopyProjectDescriptor
) => {
  const requestCopyProjectThenResync =
    actions.projectCollection.requestCopyProjectThenResync;

  const newId = await requestCopyProjectThenResync(descriptor);
  await navigate(withinApp(`/ide/${newId}`), { replace: true });
};
