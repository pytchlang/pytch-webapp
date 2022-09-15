import { assetServer } from "./asset-server";
import {
  AudioContext,
  GainNode,
  AudioBufferSourceNode,
} from "standardized-audio-context";

declare var Sk: any;

////////////////////////////////////////////////////////////////////////
//
// Types from pytch-vm

interface VM_SoundManager {
  async_load_sound: (tag: string, path: string) => Promise<VM_Sound>;
  stop_all_performances: () => void;
  reset: () => void;
  set_mix_bus_gain: (mix_bus_name: string, gain: number) => void;
  get_mix_bus_gain: (mix_bus_name: string) => number;
  one_frame: () => void;
}

interface VM_Sound {
  launch_new_performance: (mix_bus_name: string) => VM_SoundPerformance;
}

interface VM_SoundPerformance {
  tag: string;
  has_ended: boolean;
  stop: () => void;
}

////////////////////////////////////////////////////////////////////////

export class BrowserSoundManager implements VM_SoundManager {
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

  _ensureGainNode(mixBusName: string) {
    const maybeGainNode = this.gainNodeFromBusName.get(mixBusName);
    if (maybeGainNode != null) {
      return maybeGainNode;
    }

    let newGainNode = this.audioContext.createGain();
    newGainNode.connect(this.audioContext.destination);
    this.gainNodeFromBusName.set(mixBusName, newGainNode);

    return newGainNode;
  }

  set_mix_bus_gain(mixBusName: string, gain: number) {
    let gainNode = this._ensureGainNode(mixBusName);
    gainNode.gain.value = gain;
  }

  get_mix_bus_gain(mixBusName: string) {
    let gainNode = this._ensureGainNode(mixBusName);
    return gainNode.gain.value;
  }

  one_frame() {
    this.runningPerformances = this.runningPerformances.filter(
      (p) => !p.has_ended
    );
  }

  /** Create and return a new `AudioBufferSourceNode` with its output
   * connected to the `GainNode` belonging to the mix bus with the given
   * `mixBusName`.  (If no such `GainNode` yet exists, one is created
   * and noted as belonging to that mix bus.) */
  createBufferSource(mixBusName: string) {
    let bufferSource = this.audioContext.createBufferSource();
    const gainNode = this._ensureGainNode(mixBusName);
    bufferSource.connect(gainNode);
    return bufferSource;
  }
}

class BrowserSound implements VM_Sound {
  constructor(
    readonly parentSoundManager: BrowserSoundManager,
    readonly tag: string,
    readonly audioBuffer: AudioBuffer
  ) {}

  launch_new_performance(mixBusName: string): BrowserSoundPerformance {
    let soundManager = this.parentSoundManager;

    let performance = new BrowserSoundPerformance(mixBusName, this);
    soundManager.registerRunningPerformance(performance);

    return performance;
  }

  createSourceNode(mixBusName: string): AudioBufferSourceNode<AudioContext> {
    let soundManager = this.parentSoundManager;
    let bufferSource = soundManager.createBufferSource(mixBusName);
    bufferSource.buffer = this.audioBuffer;

    return bufferSource;
  }
}

class BrowserSoundPerformance implements VM_SoundPerformance {
  tag: string;
  sourceNode: AudioBufferSourceNode<AudioContext>;

  // Part of API expected by VM, so must be snake-case:
  has_ended: boolean;

  constructor(mixBusName: string, sound: BrowserSound) {
    this.tag = sound.tag;
    this.sourceNode = sound.createSourceNode(mixBusName);

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
