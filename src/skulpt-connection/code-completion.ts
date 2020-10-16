// Very rudimentary auto-completion
//
// Only complete "pytch." and "self.", with hard-coded list of options
// based on the public module functions and base-class methods.

import { IAceEditor } from "react-ace/lib/types";

const candidateFromSymbol = (meta: string) => (symbol: string) => {
  return {
    name: symbol,
    value: symbol,
    meta: meta,
  };
};

// TODO: It would be nice if these lists could be created automatically.

const completionsPytchBuiltin = [
  "Sprite",
  "Stage",
  "when_green_flag_clicked",
  "when_I_receive",
  "when_key_pressed",
  "when_I_start_as_a_clone",
  "when_this_sprite_clicked",
  "when_stage_clicked",
  "create_clone_of",
  "broadcast",
  "broadcast_and_wait",
  "stop_all_sounds",
  "wait_seconds",
  "key_is_pressed",
].map(candidateFromSymbol("pytch built-in"));

const completionsActorMethod = [
  "start_sound",
  "play_sound_until_done",
  "go_to_xy",
  "get_x",
  "set_x",
  "change_x",
  "get_y",
  "set_y",
  "change_y",
  "set_size",
  "show",
  "hide",
  "switch_costume",
  "touching",
  "delete_this_clone",
  "move_to_front_layer",
  "move_to_back_layer",
  "move_forward_layers",
  "move_backward_layers",
  "switch_backdrop",
  "say",
  "say_nothing",
  "say_for_seconds",
].map(candidateFromSymbol("Sprite/Stage method"));

export class PytchAceAutoCompleter {
  // TODO: Proper types for the remaining arguments.
  getCompletions(
    _editor: IAceEditor,
    session: any,
    pos: any,
    prefix: string,
    callback: any
  ) {
    const cursorLine = session.getLine(pos.row);
    const lineHead = cursorLine.substring(0, pos.column);

    if (!lineHead.endsWith(prefix)) {
      // TODO: What's the right way to report this error to Ace?
      callback(null, []);
    }

    const prePrefixLength = lineHead.length - prefix.length;
    const prePrefix = lineHead.substring(0, prePrefixLength);

    const candidates = prePrefix.endsWith("pytch.")
      ? completionsPytchBuiltin
      : prePrefix.endsWith("self.")
      ? completionsActorMethod
      : [];

    callback(null, candidates);
  }
}
