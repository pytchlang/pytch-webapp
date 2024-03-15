import { VersionTag } from "../../model/version-opt-in";
import { useStoreActions } from "../../store";

export const useSetActiveUiVersionFun = (versionTag: VersionTag) => {
  const setActiveUiVersion = useStoreActions(
    (actions) => actions.versionOptIn.setActiveUiVersion
  );
  return () => setActiveUiVersion(versionTag);
};
