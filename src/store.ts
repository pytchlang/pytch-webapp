import { createStore, createTypedHooks } from "easy-peasy";
import { pytchAppModel, IPytchAppModel } from "./model";

const {
    useStoreActions,
    useStoreState,
    useStoreDispatch,
} = createTypedHooks<IPytchAppModel>();

export { useStoreActions, useStoreDispatch, useStoreState };

const store = createStore(pytchAppModel);

export default store;
