import { stageHalfWidth, stageHalfHeight } from "../constants";

declare var Sk: any;

// Snake-case fields to match what Pytch expects.
interface IStageCoords {
  stage_x: number;
  stage_y: number;
}

export class BrowserMouse {
  canvas: HTMLCanvasElement;
  undrainedClicks: Array<IStageCoords>;
  clientX: number;
  clientY: number;

  constructor(canvas: HTMLCanvasElement) {
    this.undrainedClicks = [];
    this.clientX = 0.0;
    this.clientY = 0.0;

    this.canvas = canvas;

    this.canvas.onmousemove = (evt) => this.onMouseMove(evt);
    this.canvas.onmousedown = (evt) => this.onMouseDown(evt);

    Sk.pytch.mouse = this;
  }

  onMouseMove(evt: MouseEvent) {
    // Track this continuously to allow ability for Pytch programs
    // to query mouse position (at some point in the future).
    this.clientX = evt.clientX;
    this.clientY = evt.clientY;
  }

  currentStageCoords(): IStageCoords {
    const eltRect = this.canvas.getBoundingClientRect();
    const canvasX0 = eltRect.left;
    const canvasY0 = eltRect.top;

    const canvasX = this.clientX - canvasX0;
    const canvasY = this.clientY - canvasY0;

    // Recover stage coords by: translating; flipping y.
    const stage_x = canvasX - stageHalfWidth;
    const stage_y = stageHalfHeight - canvasY;

    return { stage_x, stage_y };
  }

  onMouseDown(evt: MouseEvent) {
    this.undrainedClicks.push(this.currentStageCoords());
  }

  deactivate() {
    // TODO: Should there be an API-point for doing this?
    Sk.pytch.mouse = Sk.default_pytch_environment.mouse;
  }

  // Snake-case to match what Pytch expects.
  drain_new_click_events() {
    const evts = this.undrainedClicks;
    this.undrainedClicks = [];
    return evts;
  }
}
