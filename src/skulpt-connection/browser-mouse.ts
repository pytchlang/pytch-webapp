import {
  stageHalfWidth,
  stageHalfHeight,
  stageWidth,
  stageHeight,
} from "../constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Sk: any;

// Snake-case fields to match what Pytch expects.
interface IStageCoords {
  stage_x: number;
  stage_y: number;
}

export class BrowserMouse {
  canvasOverlayDiv: HTMLDivElement;
  undrainedClicks: Array<IStageCoords>;
  clientX: number;
  clientY: number;

  constructor(canvas: HTMLDivElement) {
    this.undrainedClicks = [];
    this.clientX = 0.0;
    this.clientY = 0.0;

    this.canvasOverlayDiv = canvas;

    this.canvasOverlayDiv.onmousemove = (evt) => this.onMouseMove(evt);
    this.canvasOverlayDiv.onmousedown = (evt) => this.onMouseDown(evt);

    Sk.pytch.mouse = this;
  }

  onMouseMove(evt: MouseEvent) {
    // Track this continuously to allow ability for Pytch programs
    // to query mouse position (at some point in the future).
    this.clientX = evt.clientX;
    this.clientY = evt.clientY;
  }

  currentStageCoords(): IStageCoords {
    const canvasDiv = this.canvasOverlayDiv;

    const eltRect = canvasDiv.getBoundingClientRect();
    const canvasX0 = eltRect.left + canvasDiv.clientLeft;
    const canvasY0 = eltRect.top + canvasDiv.clientTop;

    const canvasX = this.clientX - canvasX0;
    const canvasY = this.clientY - canvasY0;

    // Recover stage coords by: scaling; translating; flipping y.
    const normalisedCanvasX = (canvasX / canvasDiv.clientWidth) * stageWidth;
    const normalisedCanvasY = (canvasY / canvasDiv.clientHeight) * stageHeight;
    const rawStageX = normalisedCanvasX - stageHalfWidth;
    const rawStageY = stageHalfHeight - normalisedCanvasY;

    // To allow for rounding errors and clicks on the 1-pixel border,
    // clamp to the allowed range of stage coords.
    const stage_x = Math.max(
      Math.min(rawStageX, stageHalfWidth),
      -stageHalfWidth
    );
    const stage_y = Math.max(
      Math.min(rawStageY, stageHalfHeight),
      -stageHalfHeight
    );

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
