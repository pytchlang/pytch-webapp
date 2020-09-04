export interface ImageRenderInstruction {
    kind: "RenderImage";
    x: number;
    y: number;
    scale: number;
    image: HTMLImageElement;
}

// In due course there will be other kinds.
export type RenderInstruction = ImageRenderInstruction;
