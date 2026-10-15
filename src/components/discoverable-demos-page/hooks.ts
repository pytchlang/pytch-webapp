import { Actions, State } from "easy-peasy";
import {
  demosForLanguage,
  IDiscoverableDemos,
} from "../../model/discoverable-demos";
import { DemoInLangCatalogue } from "../../model/discoverable-demos-schema";
import { useStoreActions, useStoreState } from "../../store";
import { useI18nResolvedLanguage } from "../Junior/hooks";

type DemoListStateMapper<R> = (state: State<IDiscoverableDemos>) => R;
type DemoListActionsMapper<R> = (actions: Actions<IDiscoverableDemos>) => R;

export function useDemoListState<R>(mapState: DemoListStateMapper<R>): R {
  return useStoreState((state) => mapState(state.discoverableDemos));
}

export function useDemoListActions<R>(mapActions: DemoListActionsMapper<R>): R {
  return useStoreActions((actions) => mapActions(actions.discoverableDemos));
}

/** Return one entry per demo from the given cross-language
 * `catalogue`, choosing each demo's entry according to the current UI
 * language. */
export function useDemosForUiLanguage(
  catalogue: DemoInLangCatalogue
): DemoInLangCatalogue {
  const uiLanguage = useI18nResolvedLanguage();
  return demosForLanguage(catalogue, uiLanguage);
}
