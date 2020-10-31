import { Action, action, Actions, Thunk, thunk } from "easy-peasy";
import { IPytchAppModel } from "..";
import { IModalUserInteraction, modalUserInteraction } from ".";

interface ICreateProjectDescriptor {
  name: string;
}

type ICreateProjectBase = IModalUserInteraction<ICreateProjectDescriptor>;
