export interface ImageRenderInstruction {
  kind: "RenderImage";
  x: number;
  y: number;
  scale: number;
  rotation: number;
  image: HTMLImageElement;
  image_cx: number;
  image_cy: number;
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
