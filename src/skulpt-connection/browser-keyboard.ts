// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let Sk: any;

type KeyName = string;

function canonicalKeyName(e: KeyboardEvent): string {
  const key = e.key;
  //The vm expect LowerCase letters for key_pressed()
  return (key.length === 1 && key.match(/[A-Z]/)) ? key.toLowerCase() : key;
}

export class BrowserKeyboard {
  undrainedKeydownKeys: Array<KeyName>;
  keyIsDown: Map<KeyName, boolean>;

  constructor(domElement: HTMLElement) {
    this.undrainedKeydownKeys = [];
    this.keyIsDown = new Map<KeyName, boolean>();

    Sk.pytch.keyboard = this;

    domElement.onkeydown = (evt) => this.onKeyDown(evt);
    domElement.onkeyup = (evt) => this.onKeyUp(evt);
  }

  onKeyDown(e: KeyboardEvent) {
    var key = canonicalKeyName(e);
    this.keyIsDown.set(key, true);
    this.undrainedKeydownKeys.push(key);
    e.preventDefault();
  }

  onKeyUp(e: KeyboardEvent) {
    var key = canonicalKeyName(e);
    this.keyIsDown.set(key, false);
    e.preventDefault();
  }

  deactivate() {
    // TODO: Should there be an API-point for doing this?
    Sk.pytch.keyboard = Sk.default_pytch_environment.keyboard;
  }

  // These two have to be snake-case because that's what Pytch API expects.

  drain_new_keydown_events() {
    const keys = this.undrainedKeydownKeys;
    this.undrainedKeydownKeys = [];
    return keys;
  }

  key_is_pressed(keyName: KeyName): boolean {
    return this.keyIsDown.get(keyName) || false;
  }
}
