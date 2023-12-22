import { urlWithinApp } from "../env-utils";
import { hexSHA256 } from "../utils";

const LOCAL_STORAGE_KEY = "pytch/anonymous-session";
const SESSION_EXPIRY_TIMEOUT_SECONDS = 3600;

class AnonymousSession {
  uuid: string;
  lastSentTime: number; // As milliseconds since epoch.
  salt: string;
  apiBaseUrl: string;

  constructor(uuid: string, lastSentTime: number, salt: string) {
    this.uuid = uuid;
    this.lastSentTime = lastSentTime;
    this.salt = salt;

    // Bit wasteful to compute this per-instance, but we need to defer
    // the computation until we're up and running and have initialised
    // the look-up table for environment variables.
    this.apiBaseUrl = urlWithinApp("/data/ok.txt");
  }

  asJson() {
    return JSON.stringify({
      uuid: this.uuid,
      lastSentTime: this.lastSentTime,
      salt: this.salt,
    });
  }

  static newRandom() {
    const uuid = globalThis.crypto.randomUUID();
    const lastSentTime = Date.now();
    const salt = globalThis.crypto.randomUUID();
    return new AnonymousSession(uuid, lastSentTime, salt);
  }

  static existingOrNew() {
    const maybeExistingJson = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (maybeExistingJson == null) {
      return AnonymousSession.newRandom();
    } else {
      const maybeExisting = JSON.parse(maybeExistingJson);
      const session = new AnonymousSession(
        maybeExisting.uuid,
        maybeExisting.lastSentTime,
        maybeExisting.salt
      );
      return session.hasExpired() ? AnonymousSession.newRandom() : session;
    }
  }

  noteJustSent() {
    this.lastSentTime = Date.now();
    window.localStorage.setItem(LOCAL_STORAGE_KEY, this.asJson());
  }

  hasExpired() {
    const secondsSinceLastSent = 1.0e-3 * (Date.now() - this.lastSentTime);
    return secondsSinceLastSent >= SESSION_EXPIRY_TIMEOUT_SECONDS;
  }

  fireAndForgetEvent(kind: string, data: string) {
    const fireAndForget = async () => {
      try {
        let suffix = "";
        if (data !== "") {
          const saltedDataStr = this.salt + data;
          const saltedDataU8s = new TextEncoder().encode(saltedDataStr);
          const dataHash = await hexSHA256(saltedDataU8s);
          suffix = `.${dataHash}`;
        }

        const eventData = `${kind}${suffix}`;
        let url = new URL(this.apiBaseUrl);
        url.searchParams.append("sid", this.uuid);
        url.searchParams.append("evt", eventData);

        await fetch(url, { cache: "no-store" });
        this.noteJustSent();
      } catch (err) {
        console.log("failure while submitting anonymous event", err);
      }
    };

    fireAndForget();
  }
}

export function fireAndForgetEvent(kind: string, data: string) {
  AnonymousSession.existingOrNew().fireAndForgetEvent(kind, data);
}
