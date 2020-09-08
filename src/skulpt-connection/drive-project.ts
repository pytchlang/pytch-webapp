import { RenderInstruction } from "./render-instructions";

declare var Sk: any;

// Ensure the "Sk.pytch" sub-environment exists.  We will
// configure it properly on build.
//
// TODO: Is this the best place to put this?
Sk.configure({});

let peId: number = 1000;

export class ProjectEngine {
  id: number;
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D;
  stageWidth: number;
  stageHeight: number;
  stageHalfWidth: number;
  stageHalfHeight: number;
  shouldRun: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.id = peId;
    peId += 1;

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
      1,
      0,
      0,
      -1,
      this.stageHalfWidth,
      this.stageHalfHeight
    );

    this.shouldRun = true;

    this.oneFrame = this.oneFrame.bind(this);
    console.log(`ProjectEngine[${this.id}]: requesting animation frame`);
    window.requestAnimationFrame(this.oneFrame);
  }

  render(project: any) {
    this.canvasContext.clearRect(
      -this.stageHalfWidth,
      -this.stageHalfHeight,
      this.stageWidth,
      this.stageHeight
    );

    const instructions = project.rendering_instructions();
    instructions.forEach((instr: RenderInstruction) => {
      switch (instr.kind) {
        case "RenderImage":
          this.canvasContext.save();
          this.canvasContext.translate(instr.x, instr.y);
          this.canvasContext.scale(instr.scale, -instr.scale);
          this.canvasContext.drawImage(instr.image, 0, 0);
          this.canvasContext.restore();
          break;

        default:
          throw Error(`unknown render-instruction kind "${instr.kind}"`);
      }
    });
  }

  oneFrame() {
    if (!this.shouldRun) {
      console.log(
        `ProjectEngine[${this.id}].oneFrame(): halt was requested; bailing`
      );
      return;
    }

    const project = Sk.pytch.current_live_project;
    if (project === Sk.default_pytch_environment.current_live_project) {
      console.log(
        `ProjectEngine[${this.id}].oneFrame(): no real live project; bailing`
      );
      return;
    }

    Sk.pytch.sound_manager.one_frame();
    project.one_frame();
    this.render(project);

    window.requestAnimationFrame(this.oneFrame);
  }

  requestHalt() {
    console.log(`ProjectEngine[${this.id}]: requestHalt()`);
    this.shouldRun = false;
  }
}
