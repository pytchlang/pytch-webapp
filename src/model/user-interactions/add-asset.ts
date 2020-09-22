import { Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IAddAssetDescriptor } from "../project";
import { IModalUserInteraction, modalUserInteraction } from ".";

type IAddAssetBase = IModalUserInteraction<IAddAssetDescriptor>;

interface IAddAssetSpecific {
  launch: Thunk<IAddAssetBase & IAddAssetSpecific>;
}

const attemptAdd = (
  actions: Actions<IPytchAppModel>,
  addDescriptor: IAddAssetDescriptor
) => actions.activeProject.addAssetAndSync(addDescriptor);

const addAssetSpecific: IAddAssetSpecific = {
  launch: thunk((actions) => actions.superLaunch()),
};

export type IAddAssetInteraction = IAddAssetBase & IAddAssetSpecific;
export const addAssetInteraction = modalUserInteraction(
  attemptAdd,
  addAssetSpecific
);
