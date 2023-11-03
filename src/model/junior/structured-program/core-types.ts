export type Uuid = string;

export class UuidOps {
  /** Return `true`/`false` according to whether the two given arrays
   * are equal in the sense that they contain the same `Uuid` values in
   * the same order. */
  static eqArrays(x: Array<Uuid>, y: Array<Uuid>): boolean {
    if (x.length !== y.length) {
      return false;
    }

    for (let i = 0; i !== x.length; ++i) {
      if (x[i] !== y[i]) {
        return false;
      }
    }

    return true;
  }
}
