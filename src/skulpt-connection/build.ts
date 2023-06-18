import { StoredProjectContent } from "../model/project";
import { assetServer } from "./asset-server";
import { ensureSoundManager } from "./sound-manager";

declare var Sk: any;

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

interface BuildSuccess {
  kind: BuildOutcomeKind.Success;
}

interface BuildFailure {
  kind: BuildOutcomeKind.Failure;
  error: any; // TODO: Can we do better here?
}

export type BuildOutcome = BuildSuccess | BuildFailure;

export const build = async (
  project: StoredProjectContent,
  addOutputChunk: (chunk: string) => void,
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
    Sk.pytch.async_load_image = (name: string) => {
      return assetServer.loadImage(name);
    };
    await Sk.pytchsupport.import_with_auto_configure(project.codeText);
    Sk.pytch.current_live_project.on_green_flag_clicked();
    return { kind: BuildOutcomeKind.Success };
  } catch (err) {
    return { kind: BuildOutcomeKind.Failure, error: err };
  }
};
