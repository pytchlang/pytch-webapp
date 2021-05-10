import { RenderInstruction } from "./render-instructions";
import {
  stageWidth,
  stageHalfWidth,
  stageHeight,
  stageHalfHeight,
} from "../constants";
import { failIfNull } from "../utils";
import {
  IQuestionFromVM,
  MaybeUserAnswerSubmissionToVM,
} from "../model/user-text-input";

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

// In due course, this API will expand to include debugger information
// as per Liam's work; in fact the approach of passing an API object to
// the project engine is his.
export interface IWebAppAPI {
  clearUserQuestion: () => void;
  askUserQuestion: (q: IQuestionFromVM) => void;
  maybeAcquireUserInputSubmission: () => MaybeUserAnswerSubmissionToVM;
}

export class ProjectEngine {
  id: number;
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D;
  bubblesDiv: HTMLDivElement;
  shouldRun: boolean;
  liveSpeechBubbles: Map<SpeakerId, LiveSpeechBubble>;
  webAppAPI: IWebAppAPI;

  constructor(
    canvas: HTMLCanvasElement,
    bubblesDiv: HTMLDivElement,
    webAppAPI: IWebAppAPI
  ) {
    this.id = peId;
    peId += 1;

    this.canvas = canvas;
    this.bubblesDiv = bubblesDiv;
    this.bubblesDiv.innerHTML = "";

    this.webAppAPI = webAppAPI;

    const context2D = failIfNull(
      this.canvas.getContext("2d"),
      "could not get 2D context for canvas"
    );

    // The following two scales should be very close to each other, but
    // rounding might mean they're not quite.  We prefer to make the
    // display stretch all the way to the edges at the possible cost of
    // a tiny deviation from the true aspect ratio.
    const stageScaleX = canvas.width / stageWidth;
    const stageScaleY = canvas.height / stageHeight;

    // Effect transform by setting directly; we seem to keep
    // the same context from one invocation to the next, so
    // do not want the transformations to pile up.
    this.canvasContext = context2D;
    this.canvasContext.setTransform(
      stageScaleX,
      0,
      0,
      -stageScaleY, // Negate to get Y increasing upwards in Pytch world
      0.5 * canvas.width,
      0.5 * canvas.height
    );

    this.liveSpeechBubbles = new Map();

    this.shouldRun = true;

    this.oneFrame = this.oneFrame.bind(this);
    console.log(
      `ProjectEngine[${this.id}]:` +
        ` canvas is ${canvas.width} × ${canvas.height};` +
        " requesting animation frame"
    );
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

    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    const canvasTipX = bubble.tipX * (canvasWidth / stageWidth);
    const canvasTipY = bubble.tipY * (canvasHeight / stageHeight);

    const canvasCentreX = 0.5 * canvasWidth;
    const canvasCentreY = 0.5 * canvasHeight;

    const rawLeft = canvasCentreX + canvasTipX - 0.5 * div.clientWidth;
    const rawBottom = canvasCentreY + canvasTipY;

    if (rawLeft < 4) {
      div.style.left = "4px";
    } else if (rawLeft + div.clientWidth > canvasWidth - 4) {
      div.style.left = "";
      div.style.right = "4px";
    } else {
      div.style.left = `${rawLeft}px`;
    }

    if (rawBottom < 4) {
      div.style.bottom = "4px";
    } else if (rawBottom + div.clientHeight > canvasHeight - 4) {
      div.style.top = "4px";
      div.style.bottom = "";
    } else {
      div.style.bottom = `${rawBottom}px`;
    }

    const liveBubble: LiveSpeechBubble = { ...bubble, div };
    this.liveSpeechBubbles.set(bubble.speakerId, liveBubble);
  }

  removeSpeechBubble(speaker: SpeakerId) {
    const liveBubble = this.liveSpeechBubbles.get(speaker)!;
    const liveDiv = liveBubble.div;
    liveDiv.parentNode!.removeChild(liveDiv);
    this.liveSpeechBubbles.delete(speaker);
  }

  // This patch mechanism is very close to re-inventing the wheel of
  // React, but an earlier implementation with React resulted in the
  // DIVs jittering horizontally.  I suspect this might be something
  // to do with DIV positions being rounded to integer pixels, but did
  // not investigate fully.  Doing it ourselves ensures that we place
  // each speech-bubble DIV exactly once, unless/until it changes.
  // Each Sprite instance can have at most one live speech bubble, so
  // we can key off the speaker-id.

  patchLiveSpeechBubbles(wantedBubbles: Map<SpeakerId, ISpeechBubble>) {
    let bubblesToRemove = new Set<SpeakerId>();
    let bubblesToAdd = new Set<ISpeechBubble>();

    for (const [speaker, liveBubble] of this.liveSpeechBubbles) {
      if (!wantedBubbles.has(speaker)) {
        bubblesToRemove.add(liveBubble.speakerId);
      } else {
        const wantedBubble = wantedBubbles.get(speaker)!;
        if (
          liveBubble.content !== wantedBubble.content ||
          liveBubble.tipX !== wantedBubble.tipX ||
          liveBubble.tipY !== wantedBubble.tipY
        ) {
          bubblesToRemove.add(liveBubble.speakerId);
          bubblesToAdd.add(wantedBubble);
        }
      }
    }

    for (const [speaker, wantedBubble] of wantedBubbles) {
      if (!this.liveSpeechBubbles.has(speaker)) {
        bubblesToAdd.add(wantedBubble);
      }
    }

    bubblesToRemove.forEach((speaker) => this.removeSpeechBubble(speaker));
    bubblesToAdd.forEach((bubble) => this.addSpeechBubble(bubble));
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

    let wantedSpeechBubbles: Map<SpeakerId, ISpeechBubble> = new Map();
    instructions.forEach((instr: RenderInstruction) => {
      switch (instr.kind) {
        case "RenderImage":
          this.canvasContext.save();
          this.canvasContext.translate(instr.x, instr.y);
          this.canvasContext.scale(instr.scale, -instr.scale);
          this.canvasContext.drawImage(instr.image, 0, 0);
          this.canvasContext.restore();
          break;

        case "RenderSpeechBubble":
          wantedSpeechBubbles.set(instr.speaker_id, {
            speakerId: instr.speaker_id,
            content: instr.content,
            tipX: instr.tip_x,
            tipY: instr.tip_y,
          });
          break;

        default:
          throw Error(
            `unknown render-instruction kind "${(instr as any).kind}"`
          );
      }
    });

    this.patchLiveSpeechBubbles(wantedSpeechBubbles);

    return true;
  }

  oneFrame() {
    const logIntro = `ProjectEngine[${this.id}].oneFrame()`;

    if (!this.shouldRun) {
      console.log(`${logIntro}: halt was requested; bailing`);
      return;
    }

    const project = Sk.pytch.current_live_project;
    if (project === Sk.default_pytch_environment.current_live_project) {
      console.log(`${logIntro}: no real live project; bailing`);
      return;
    }

    Sk.pytch.sound_manager.one_frame();
    project.one_frame();
    const renderSucceeded = this.render(project);

    if (!renderSucceeded) {
      console.log(`${logIntro}: error while rendering; bailing`);
      return;
    }

    window.requestAnimationFrame(this.oneFrame);
  }

  requestHalt() {
    console.log(`ProjectEngine[${this.id}]: requestHalt()`);
    this.shouldRun = false;
  }
}
