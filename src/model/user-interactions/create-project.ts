import { Action, action, Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";

interface ICreateProjectDescriptor {
  name: string;
}

type ICreateProjectBase = IModalUserInteraction<ICreateProjectDescriptor>;

interface ICreateProjectSpecific {
  name: string;
  setName: Action<ICreateProjectSpecific, string>;

  refreshInputsReady: Thunk<ICreateProjectBase & ICreateProjectSpecific>;
  launch: Thunk<ICreateProjectBase & ICreateProjectSpecific, void>;
}
