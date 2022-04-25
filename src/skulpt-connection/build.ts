import { liveSourceMap } from "./code-editor";
import { PytchProgramOps } from "../model/pytch-program";
import { assetServer } from "./asset-server";
import { ensureGpioConnection } from "./gpios";
import { ensureSoundManager } from "./sound-manager";
import { ProjectContent } from "../model/project-core";
import { AssetPresentation } from "../model/asset";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Sk: any;

const builtinRead = (fileName: string) => {
  if (
    Sk.builtinFiles === undefined ||
    Sk.builtinFiles["files"][fileName] === undefined
  ) {
    throw Error(`File not found: '${fileName}'`);
  }

  return Sk.builtinFiles["files"][fileName];
};

export enum BuildOutcomeKind {
  Success,
  Failure,
}

export class BuildOutcomeKindOps {
  static displayName(kind: BuildOutcomeKind) {
    switch (kind) {
      case BuildOutcomeKind.Success:
        return "success";
      case BuildOutcomeKind.Failure:
        return "failure";
      default:
        return "unknown";
    }
  }
}

interface BuildSuccess {
  kind: BuildOutcomeKind.Success;
}

interface BuildFailure {
  kind: BuildOutcomeKind.Failure;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any; // TODO: Can we do better here?
}

export type BuildOutcome = BuildSuccess | BuildFailure;

export const build = async (
  project: ProjectContent<AssetPresentation>,
  addOutputChunk: (chunk: string) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleError: (pytchError: any, errorContext: any) => void
): Promise<BuildOutcome> => {
  // This also resets the current_live_project slot.
  Sk.configure({
    __future__: Sk.python3,
    read: builtinRead,
    output: addOutputChunk,
    pytch: { on_exception: handleError },
  });
  try {
    ensureSoundManager();
    ensureGpioConnection();

    Sk.pytch.async_load_image = (name: string) => assetServer.loadImage(name);

    const flattenedProgram = PytchProgramOps.flatCodeText(
      project.program,
      project.assets
    );
    const codeText = flattenedProgram.codeText;
    liveSourceMap.setEntries(flattenedProgram.mapEntries);
    await Sk.pytchsupport.import_with_auto_configure(codeText);
    Sk.pytch.current_live_project.on_green_flag_clicked();
    return { kind: BuildOutcomeKind.Success };
  } catch (err) {
    return { kind: BuildOutcomeKind.Failure, error: err };
  }
};
