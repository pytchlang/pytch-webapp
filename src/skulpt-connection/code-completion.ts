// Very rudimentary auto-completion
//
// Only complete "pytch." and "self.", with hard-coded list of options
// based on the public module functions and base-class methods.

const candidateFromSymbol = (meta: string) => (symbol: string) => {
  return {
    name: symbol,
    value: symbol,
    meta: meta,
  };
};

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
].map(candidateFromSymbol("Sprite/Stage method"));
