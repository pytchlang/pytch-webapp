export interface ImageRenderInstruction {
  kind: "RenderImage";
  x: number;
  y: number;
  scale: number;
  image: HTMLImageElement;
}

export interface SpeechBubbleRenderInstruction {
  kind: "RenderSpeechBubble";
  speaker_id: number;
  content: string;
  tip_x: number;
  tip_y: number;
}

export interface AttributeWatcherRenderInstruction {
  kind: "RenderAttributeWatcher";
  key: string;
  label: string;
  value: string;
  position: Array<number | null>;
}

export type RenderInstruction =
  | ImageRenderInstruction
  | SpeechBubbleRenderInstruction
  | AttributeWatcherRenderInstruction;
