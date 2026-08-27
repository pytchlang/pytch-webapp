import { SkipLinkFocusTarget } from "../../../src/model/junior/global-steer-focus";
import { PytchProgramKind } from "../../../src/model/pytch-program-types";

type SkipLinkSpec = {
  target: SkipLinkFocusTarget;
  assertFun: () => void;
};
type SkipLinkTestSpec = {
  programKind: PytchProgramKind;
  projectZipfileFixture: string;
  skipSpecs: Array<SkipLinkSpec>;
};
