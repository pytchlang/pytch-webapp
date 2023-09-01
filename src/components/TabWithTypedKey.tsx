import { Tab as RawBootstrapTab, TabProps } from "react-bootstrap";
export { Tabs } from "react-bootstrap";

type TypedTabProps<T> = TabProps & { eventKey: T };

/** Exactly as Bootstrap's `<Tab>` component, except that the `eventKey`
 * property must be of the given type `T`, which is typically a
 * union-of-strings type like `"big" | "small"`.  */
export function TabWithTypedKey<T>(props: TypedTabProps<T>): JSX.Element {
  return <RawBootstrapTab {...props}>{props.children}</RawBootstrapTab>;
}
