// Is there a cleaner way of getting at this types?
import { IAceEditorProps } from "react-ace";
type AceEditorT = Parameters<Required<IAceEditorProps>["onLoad"]>[0];
type AceRange = ReturnType<AceEditorT["getSelectionRange"]>;
type AceToken = ReturnType<AceEditorT["session"]["getTokens"]>[number];
