import { assetServer } from "./asset-server";
import { AudioContext, GainNode } from "standardized-audio-context";

declare var Sk: any;

export class BrowserSoundManager {
  audioContext: AudioContext;
  runningPerformances: Array<BrowserSoundPerformance>;
  gainNodeFromBusName: Map<string, GainNode<AudioContext>>;

  constructor() {
    this.audioContext = new AudioContext();
    this.runningPerformances = [];
    this.gainNodeFromBusName = new Map<string, GainNode<AudioContext>>();
  }

  // Snake-case name is what Skulpt/Pytch expects.
  //
  async async_load_sound(tag: string, name: string) {
    // decodedAudioData() destroys the passed-in ArrayBuffer, so give it
    // a copy to work with:
    const audioData = assetServer.loadSoundData(name).slice(0);
    const audioBuffer = await this.audioContext.decodeAudioData(audioData);

    return new BrowserSound(this, tag, audioBuffer);
  }

  registerRunningPerformance(performance: BrowserSoundPerformance) {
    this.runningPerformances.push(performance);
  }

  stop_all_performances() {
    this.runningPerformances.forEach((p) => p.stop());
    this.runningPerformances = [];
  }

  reset() {
    // Might this leave some GainNode instances still in use?  I think
    // they'll be GC'd once the sounds actually stop anyway.
    this.stop_all_performances();
    this.gainNodeFromBusName.clear();
  }

  one_frame() {
    this.runningPerformances = this.runningPerformances.filter(
      (p) => !p.has_ended
    );
  }

  createBufferSource() {
    let bufferSource = this.audioContext.createBufferSource();
    bufferSource.connect(this.audioContext.destination);
    return bufferSource;
  }
}

class BrowserSound {
  constructor(
    readonly parentSoundManager: BrowserSoundManager,
    readonly tag: string,
    readonly audioBuffer: AudioBuffer
  ) {}

  launch_new_performance(): BrowserSoundPerformance {
    let soundManager = this.parentSoundManager;

    let performance = new BrowserSoundPerformance(this);
    soundManager.registerRunningPerformance(performance);

    return performance;
  }

  createSourceNode(): AudioBufferSourceNode {
    let soundManager = this.parentSoundManager;
    let bufferSource = soundManager.createBufferSource();
    bufferSource.buffer = this.audioBuffer;

    // @ts-ignore -- detune not implemented in AudioBufferSourceNode
    return bufferSource;
  }
}

class BrowserSoundPerformance {
  tag: string;
  sourceNode: AudioBufferSourceNode;

  // Part of API expected by VM, so must be snake-case:
  has_ended: boolean;

  constructor(sound: BrowserSound) {
    this.tag = sound.tag;
    this.sourceNode = sound.createSourceNode();

    this.has_ended = false;
    this.sourceNode.onended = () => {
      this.has_ended = true;
    };

    this.sourceNode.start();
  }

  stop() {
    this.sourceNode.stop();
    this.has_ended = true;
  }
}

// Chrome (and possibly other browsers) won't let you create a running
// AudioContext unless you're doing so in response to a user gesture.  We
// therefore defer creation and connection of the global Skulpt/Pytch sound
// manager until first 'BUILD'.  The default Pytch sound-manager has a
// 'do-nothing' implementation of one_frame(), so we can safely call it in
// the main per-frame function below.

let browserSoundManager: BrowserSoundManager | null = null;

export const ensureSoundManager = () => {
  if (browserSoundManager == null) {
    browserSoundManager = new BrowserSoundManager();
  }
  Sk.pytch.sound_manager = browserSoundManager;
  console.log("have set Sk.pytch.sound_manager = browserSoundManager");
};
