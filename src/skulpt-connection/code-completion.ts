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
