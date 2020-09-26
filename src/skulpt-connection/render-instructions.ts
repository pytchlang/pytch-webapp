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

// In due course there will be other kinds.
export type RenderInstruction = ImageRenderInstruction;
