require("./commands");

export function cartesianProduct<T1, T2>(
  xs1: Array<T1>,
  xs2: Array<T2>
): Array<T1 & T2> {
  let xs12: Array<T1 & T2> = [];
  xs1.forEach((x1) => {
    xs2.forEach((x2) => {
      xs12.push(Object.assign({}, x1, x2));
    });
  });
  return xs12;
}
