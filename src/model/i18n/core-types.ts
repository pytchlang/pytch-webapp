import { CustomTypeOptions } from "i18next";

export type I18nResources = CustomTypeOptions["resources"];
export type I18nNamespace = keyof I18nResources;

// The "replace" options is typed as "any"; try something a bit richer.
export type I18nParams = Record<string, unknown> & { count?: number };

type I18nFullyQualifiedKey = { ns: I18nNamespace; key: string };

// keyPart here is because this type might be used in contexts where
// there are other parts to the key.  In some contexts it might be an
// error for keyPart to be null.  We might need to revisit this.
export type I18nStringSpec = {
  keyPart: string | null;
  params?: I18nParams;
  indirectParams?: Record<string, I18nFullyQualifiedKey>;
  ns: I18nNamespace;
};

export type I18nStringSpecWithKeyPart = I18nStringSpec & { keyPart: string };

export type RawOrI18nStringSpec =
  | { kind: "raw"; text: string }
  | { kind: "i18n"; spec: I18nStringSpecWithKeyPart };

export const mkRawSpec = (text: string): RawOrI18nStringSpec => ({
  kind: "raw",
  text,
});

export const defaultNS = "common";
