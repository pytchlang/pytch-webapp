export class ProjectEngine {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    stageWidth: number;
    stageHeight: number;
    stageHalfWidth: number;
    stageHalfHeight: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.stageWidth = this.canvas.width;
        this.stageHalfWidth = (this.stageWidth / 2) | 0;
        this.stageHeight = this.canvas.height;
        this.stageHalfHeight = (this.stageHeight / 2) | 0;

        const maybeCtx = this.canvas.getContext("2d");
        if (maybeCtx == null) {
            throw Error("could not get 2D context for canvas");
        }

        // Effect transform by setting directly; we seem to keep
        // the same context from one invocation to the next, so
        // do not want the transformations to pile up.
        this.canvasContext = maybeCtx;
        this.canvasContext.setTransform(
            1, 0, 0, -1,
            this.stageHalfWidth, this.stageHalfHeight
        );
    }
}
