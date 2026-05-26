import { Action, Actions, thunk, Thunk } from "easy-peasy";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { propSetterAction } from "../utils";
import { pathWithinApp } from "../env-utils";
import { defaultNS } from "./i18n/core-types";

export const supportedLanguages = [
  { lngCode: "en", name: "English" },
  { lngCode: "ga", name: "Gaeilge" },
];

// "Slice action" / "slice async thunk" types, forward-referencing the
// model slice type I18nContextState.

type SAction<ArgT = void> = Action<I18nContextState, ArgT>;

type SAThunk<PayloadT, ReturnT = void> = Thunk<
  I18nContextState,
  PayloadT,
  unknown,
  object,
  Promise<ReturnT>
>;

type I18nStateKind = "not-yet-booted" | "pending" | "ready" | "failed";

export type I18nContextState = {
  i18nStateKind: I18nStateKind;
  setI18nStateKind: SAction<I18nStateKind>;

  boot: SAThunk<Record<string, unknown>>;
  setLanguage: SAThunk<string>;
};

async function withStateUpdates(
  actions: Actions<I18nContextState>,
  body: () => Promise<void>
) {
  actions.setI18nStateKind("pending");
  try {
    await body();
    actions.setI18nStateKind("ready");
  } catch {
    actions.setI18nStateKind("failed");
  }
}

export let i18nContextState: I18nContextState = {
  i18nStateKind: "not-yet-booted",
  setI18nStateKind: propSetterAction("i18nStateKind"),

  boot: thunk(async (actions, components, helpers) => {
    if (helpers.getState().i18nStateKind !== "not-yet-booted") {
      return;
    }

    await withStateUpdates(actions, async () => {
      i18next.use(Backend).use(LanguageDetector).use(initReactI18next);
      await i18next.init({
        backend: { loadPath: pathWithinApp("/locales/{{lng}}/{{ns}}.json") },
        ns: [
          "common",
          "assets",
          "demos",
          "errors",
          "flows",
          "ide",
          "notable-changes",
          "projects",
          "tutorials",
          "vm",
          "welcome",
        ],
        defaultNS,
        fallbackLng: "en",
        debug: false,
        interpolation: { escapeValue: false },
        react: {
          transSupportBasicHtmlNodes: false,
          transDefaultProps: {
            tOptions: { interpolation: { escapeValue: true } },
            components,
            shouldUnescape: true,
          },
        },
      });
    });
  }),

  setLanguage: thunk(async (actions, lng) => {
    await withStateUpdates(actions, async () => {
      await i18next.changeLanguage(lng);
    });
  }),
};
