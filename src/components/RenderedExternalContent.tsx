import React from "react";
import { State } from "easy-peasy";
import { ContentFetchState } from "../model/external-json-data";
import { IPytchAppModel } from "../model";

type FetchStateMapper<ContentT> = (
  state: State<IPytchAppModel>
) => ContentFetchState<ContentT>;
