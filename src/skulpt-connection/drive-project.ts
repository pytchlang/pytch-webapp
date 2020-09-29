import { RenderInstruction } from "./render-instructions";
import {
  stageWidth,
  stageHalfWidth,
  stageHeight,
  stageHalfHeight,
} from "../constants";

declare var Sk: any;

// Ensure the "Sk.pytch" sub-environment exists.  We will
// configure it properly on build.
//
// TODO: Is this the best place to put this?
Sk.configure({});

let peId: number = 1000;

type SpeakerId = number;

export interface ISpeechBubble {
  speakerId: SpeakerId;
  content: string;
  tipX: number;
  tipY: number;
}

type LiveSpeechBubble = ISpeechBubble & { div: HTMLDivElement };

export class ProjectEngine {
  id: number;
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D;
  bubblesDiv: HTMLDivElement;
  shouldRun: boolean;
  liveSpeechBubbles: Map<SpeakerId, LiveSpeechBubble>;

  constructor(canvas: HTMLCanvasElement, bubblesDiv: HTMLDivElement) {
    this.id = peId;
    peId += 1;

    this.canvas = canvas;
    this.bubblesDiv = bubblesDiv;
    this.bubblesDiv.innerHTML = "";

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
      stageHalfWidth,
      stageHalfHeight
    );

    this.liveSpeechBubbles = new Map();

    this.shouldRun = true;

    this.oneFrame = this.oneFrame.bind(this);
    console.log(`ProjectEngine[${this.id}]: requesting animation frame`);
    window.requestAnimationFrame(this.oneFrame);
  }

  // We first create an element at the bottom-left of the stage, and
  // then move it to the right place via a layout effect.  We can't just
  // put it in the right place straight away, because we need to know
  // how wide it is to get the horizontal placement right.  And if we
  // temporarily put it in nearly the right place, the placement engine
  // might make it narrower than needed, to not jut out to the right,
  // then when we move it, it gets wider again.  When initially created,
  // the element has 'left' and 'bottom' constraints.  If we end up
  // needing to clamp it to the right or top edge, we replace the 'left'
  // constraint with 'right', or the 'bottom' with 'top'.

  createRawSpeechBubble(content: string): HTMLDivElement {
    // This is really tedious but it seemed worse to bring React and JSX
    // into it.
    let div = document.createElement("div");
    div.className = "speech-bubble";
    div.style.left = "0px";
    div.style.bottom = "0px";

    let contentSpan = document.createElement("span");
    contentSpan.className = "content";
    contentSpan.innerText = content;
    div.appendChild(contentSpan);

    let arrowDiv = document.createElement("div");
    arrowDiv.className = "arrow";
    div.appendChild(arrowDiv);

    return div;
  }

  addSpeechBubble(bubble: ISpeechBubble) {
    const div = this.createRawSpeechBubble(bubble.content);
    this.bubblesDiv.appendChild(div);

    const rawLeft = stageHalfWidth + bubble.tipX - 0.5 * div.clientWidth;
    const rawBottom = stageHalfHeight + bubble.tipY;

    if (rawLeft < 4) {
      div.style.left = "4px";
    } else if (rawLeft + div.clientWidth > stageWidth - 4) {
      div.style.left = "";
      div.style.right = "4px";
    } else {
      div.style.left = `${rawLeft}px`;
    }

    if (rawBottom < 4) {
      div.style.bottom = "4px";
    } else if (rawBottom + div.clientHeight > stageHeight - 4) {
      div.style.top = "4px";
      div.style.bottom = "";
    } else {
      div.style.bottom = `${rawBottom}px`;
    }

    const liveBubble: LiveSpeechBubble = { ...bubble, div };
    this.liveSpeechBubbles.set(bubble.speakerId, liveBubble);
  }

  render(project: any) {
    this.canvasContext.clearRect(
      -stageHalfWidth,
      -stageHalfHeight,
      stageWidth,
      stageHeight
    );

    const instructions = project.rendering_instructions();
    if (instructions == null) {
      return false;
    }

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

    return true;
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
    const renderSucceeded = this.render(project);

    if (!renderSucceeded) {
      console.log(
        `ProjectEngine[${this.id}].oneFrame(): error while rendering; bailing`
      );
      return;
    }

    window.requestAnimationFrame(this.oneFrame);
  }

  requestHalt() {
    console.log(`ProjectEngine[${this.id}]: requestHalt()`);
    this.shouldRun = false;
  }
}
