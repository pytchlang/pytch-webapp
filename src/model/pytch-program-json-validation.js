/* eslint-disable */

/* This file is auto-generated. */
/* See refresh-pytch-program-json-validation.sh for the gory details. */

"use strict";
export const validate = validate20;
// module.exports.default = validate20;
const schema22 = {
  $defs: {
    ActorKind: { type: "string", enum: ["sprite", "stage"] },
    "EventDescriptor-green-flag": {
      type: "object",
      properties: { kind: { const: "green-flag" } },
    },
    "EventDescriptor-clicked": {
      type: "object",
      properties: { kind: { const: "clicked" } },
    },
    "EventDescriptor-start-as-clone": {
      type: "object",
      properties: { kind: { const: "start-as-clone" } },
    },
    "EventDescriptor-key-pressed": {
      type: "object",
      properties: {
        kind: { const: "key-pressed" },
        key: {
          type: "object",
          properties: { browserKeyName: { type: "string" } },
        },
      },
    },
    "EventDescriptor-message-received": {
      type: "object",
      properties: {
        kind: { const: "message-received" },
        key: { type: "object", properties: { message: { type: "string" } } },
      },
    },
    EventDescriptor: {
      type: "object",
      oneOf: [
        { $ref: "#/$defs/EventDescriptor-green-flag" },
        { $ref: "#/$defs/EventDescriptor-key-pressed" },
        { $ref: "#/$defs/EventDescriptor-message-received" },
        { $ref: "#/$defs/EventDescriptor-start-as-clone" },
        { $ref: "#/$defs/EventDescriptor-clicked" },
      ],
    },
    EventHandler: {
      type: "object",
      properties: {
        id: { type: "string" },
        event: { $ref: "#/$defs/EventDescriptor" },
        pythonCode: { type: "string" },
      },
    },
    Actor: {
      type: "object",
      properties: {
        id: { type: "string" },
        kind: { $ref: "#/$defs/ActorKind" },
        name: { type: "string" },
        handlers: { type: "array", items: { $ref: "#/$defs/EventHandler" } },
      },
    },
    StructuredProgram: {
      type: "object",
      properties: {
        actors: { type: "array", items: { $ref: "#/$defs/Actor" } },
      },
    },
  },
  type: "object",
  oneOf: [
    {
      properties: { kind: { const: "flat" }, text: { type: "string" } },
      required: ["kind", "text"],
    },
    {
      properties: {
        kind: { const: "per-method" },
        program: { $ref: "#/$defs/StructuredProgram" },
      },
      required: ["kind", "program"],
    },
  ],
};
const schema23 = {
  type: "object",
  properties: { actors: { type: "array", items: { $ref: "#/$defs/Actor" } } },
};
const schema24 = {
  type: "object",
  properties: {
    id: { type: "string" },
    kind: { $ref: "#/$defs/ActorKind" },
    name: { type: "string" },
    handlers: { type: "array", items: { $ref: "#/$defs/EventHandler" } },
  },
};
const schema25 = { type: "string", enum: ["sprite", "stage"] };
const schema26 = {
  type: "object",
  properties: {
    id: { type: "string" },
    event: { $ref: "#/$defs/EventDescriptor" },
    pythonCode: { type: "string" },
  },
};
const schema27 = {
  type: "object",
  oneOf: [
    { $ref: "#/$defs/EventDescriptor-green-flag" },
    { $ref: "#/$defs/EventDescriptor-key-pressed" },
    { $ref: "#/$defs/EventDescriptor-message-received" },
    { $ref: "#/$defs/EventDescriptor-start-as-clone" },
    { $ref: "#/$defs/EventDescriptor-clicked" },
  ],
};
const schema28 = {
  type: "object",
  properties: { kind: { const: "green-flag" } },
};
const schema29 = {
  type: "object",
  properties: {
    kind: { const: "key-pressed" },
    key: { type: "object", properties: { browserKeyName: { type: "string" } } },
  },
};
const schema30 = {
  type: "object",
  properties: {
    kind: { const: "message-received" },
    key: { type: "object", properties: { message: { type: "string" } } },
  },
};
const schema31 = {
  type: "object",
  properties: { kind: { const: "start-as-clone" } },
};
const schema32 = { type: "object", properties: { kind: { const: "clicked" } } };
function validate24(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {}
) {
  let vErrors = null;
  let errors = 0;
  if (!(data && typeof data == "object" && !Array.isArray(data))) {
    validate24.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "object" },
        message: "must be object",
      },
    ];
    return false;
  }
  const _errs1 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs2 = errors;
  const _errs3 = errors;
  if (errors === _errs3) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.kind !== undefined) {
        if ("green-flag" !== data.kind) {
          const err0 = {
            instancePath: instancePath + "/kind",
            schemaPath:
              "#/$defs/EventDescriptor-green-flag/properties/kind/const",
            keyword: "const",
            params: { allowedValue: "green-flag" },
            message: "must be equal to constant",
          };
          if (vErrors === null) {
            vErrors = [err0];
          } else {
            vErrors.push(err0);
          }
          errors++;
        }
      }
    } else {
      const err1 = {
        instancePath,
        schemaPath: "#/$defs/EventDescriptor-green-flag/type",
        keyword: "type",
        params: { type: "object" },
        message: "must be object",
      };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
  }
  var _valid0 = _errs2 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
  }
  const _errs6 = errors;
  const _errs7 = errors;
  if (errors === _errs7) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.kind !== undefined) {
        const _errs9 = errors;
        if ("key-pressed" !== data.kind) {
          const err2 = {
            instancePath: instancePath + "/kind",
            schemaPath:
              "#/$defs/EventDescriptor-key-pressed/properties/kind/const",
            keyword: "const",
            params: { allowedValue: "key-pressed" },
            message: "must be equal to constant",
          };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        var valid4 = _errs9 === errors;
      } else {
        var valid4 = true;
      }
      if (valid4) {
        if (data.key !== undefined) {
          let data2 = data.key;
          const _errs10 = errors;
          if (errors === _errs10) {
            if (data2 && typeof data2 == "object" && !Array.isArray(data2)) {
              if (data2.browserKeyName !== undefined) {
                if (typeof data2.browserKeyName !== "string") {
                  const err3 = {
                    instancePath: instancePath + "/key/browserKeyName",
                    schemaPath:
                      "#/$defs/EventDescriptor-key-pressed/properties/key/properties/browserKeyName/type",
                    keyword: "type",
                    params: { type: "string" },
                    message: "must be string",
                  };
                  if (vErrors === null) {
                    vErrors = [err3];
                  } else {
                    vErrors.push(err3);
                  }
                  errors++;
                }
              }
            } else {
              const err4 = {
                instancePath: instancePath + "/key",
                schemaPath:
                  "#/$defs/EventDescriptor-key-pressed/properties/key/type",
                keyword: "type",
                params: { type: "object" },
                message: "must be object",
              };
              if (vErrors === null) {
                vErrors = [err4];
              } else {
                vErrors.push(err4);
              }
              errors++;
            }
          }
          var valid4 = _errs10 === errors;
        } else {
          var valid4 = true;
        }
      }
    } else {
      const err5 = {
        instancePath,
        schemaPath: "#/$defs/EventDescriptor-key-pressed/type",
        keyword: "type",
        params: { type: "object" },
        message: "must be object",
      };
      if (vErrors === null) {
        vErrors = [err5];
      } else {
        vErrors.push(err5);
      }
      errors++;
    }
  }
  var _valid0 = _errs6 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
    }
    const _errs14 = errors;
    const _errs15 = errors;
    if (errors === _errs15) {
      if (data && typeof data == "object" && !Array.isArray(data)) {
        if (data.kind !== undefined) {
          const _errs17 = errors;
          if ("message-received" !== data.kind) {
            const err6 = {
              instancePath: instancePath + "/kind",
              schemaPath:
                "#/$defs/EventDescriptor-message-received/properties/kind/const",
              keyword: "const",
              params: { allowedValue: "message-received" },
              message: "must be equal to constant",
            };
            if (vErrors === null) {
              vErrors = [err6];
            } else {
              vErrors.push(err6);
            }
            errors++;
          }
          var valid7 = _errs17 === errors;
        } else {
          var valid7 = true;
        }
        if (valid7) {
          if (data.key !== undefined) {
            let data5 = data.key;
            const _errs18 = errors;
            if (errors === _errs18) {
              if (data5 && typeof data5 == "object" && !Array.isArray(data5)) {
                if (data5.message !== undefined) {
                  if (typeof data5.message !== "string") {
                    const err7 = {
                      instancePath: instancePath + "/key/message",
                      schemaPath:
                        "#/$defs/EventDescriptor-message-received/properties/key/properties/message/type",
                      keyword: "type",
                      params: { type: "string" },
                      message: "must be string",
                    };
                    if (vErrors === null) {
                      vErrors = [err7];
                    } else {
                      vErrors.push(err7);
                    }
                    errors++;
                  }
                }
              } else {
                const err8 = {
                  instancePath: instancePath + "/key",
                  schemaPath:
                    "#/$defs/EventDescriptor-message-received/properties/key/type",
                  keyword: "type",
                  params: { type: "object" },
                  message: "must be object",
                };
                if (vErrors === null) {
                  vErrors = [err8];
                } else {
                  vErrors.push(err8);
                }
                errors++;
              }
            }
            var valid7 = _errs18 === errors;
          } else {
            var valid7 = true;
          }
        }
      } else {
        const err9 = {
          instancePath,
          schemaPath: "#/$defs/EventDescriptor-message-received/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        };
        if (vErrors === null) {
          vErrors = [err9];
        } else {
          vErrors.push(err9);
        }
        errors++;
      }
    }
    var _valid0 = _errs14 === errors;
    if (_valid0 && valid0) {
      valid0 = false;
      passing0 = [passing0, 2];
    } else {
      if (_valid0) {
        valid0 = true;
        passing0 = 2;
      }
      const _errs22 = errors;
      const _errs23 = errors;
      if (errors === _errs23) {
        if (data && typeof data == "object" && !Array.isArray(data)) {
          if (data.kind !== undefined) {
            if ("start-as-clone" !== data.kind) {
              const err10 = {
                instancePath: instancePath + "/kind",
                schemaPath:
                  "#/$defs/EventDescriptor-start-as-clone/properties/kind/const",
                keyword: "const",
                params: { allowedValue: "start-as-clone" },
                message: "must be equal to constant",
              };
              if (vErrors === null) {
                vErrors = [err10];
              } else {
                vErrors.push(err10);
              }
              errors++;
            }
          }
        } else {
          const err11 = {
            instancePath,
            schemaPath: "#/$defs/EventDescriptor-start-as-clone/type",
            keyword: "type",
            params: { type: "object" },
            message: "must be object",
          };
          if (vErrors === null) {
            vErrors = [err11];
          } else {
            vErrors.push(err11);
          }
          errors++;
        }
      }
      var _valid0 = _errs22 === errors;
      if (_valid0 && valid0) {
        valid0 = false;
        passing0 = [passing0, 3];
      } else {
        if (_valid0) {
          valid0 = true;
          passing0 = 3;
        }
        const _errs26 = errors;
        const _errs27 = errors;
        if (errors === _errs27) {
          if (data && typeof data == "object" && !Array.isArray(data)) {
            if (data.kind !== undefined) {
              if ("clicked" !== data.kind) {
                const err12 = {
                  instancePath: instancePath + "/kind",
                  schemaPath:
                    "#/$defs/EventDescriptor-clicked/properties/kind/const",
                  keyword: "const",
                  params: { allowedValue: "clicked" },
                  message: "must be equal to constant",
                };
                if (vErrors === null) {
                  vErrors = [err12];
                } else {
                  vErrors.push(err12);
                }
                errors++;
              }
            }
          } else {
            const err13 = {
              instancePath,
              schemaPath: "#/$defs/EventDescriptor-clicked/type",
              keyword: "type",
              params: { type: "object" },
              message: "must be object",
            };
            if (vErrors === null) {
              vErrors = [err13];
            } else {
              vErrors.push(err13);
            }
            errors++;
          }
        }
        var _valid0 = _errs26 === errors;
        if (_valid0 && valid0) {
          valid0 = false;
          passing0 = [passing0, 4];
        } else {
          if (_valid0) {
            valid0 = true;
            passing0 = 4;
          }
        }
      }
    }
  }
  if (!valid0) {
    const err14 = {
      instancePath,
      schemaPath: "#/oneOf",
      keyword: "oneOf",
      params: { passingSchemas: passing0 },
      message: "must match exactly one schema in oneOf",
    };
    if (vErrors === null) {
      vErrors = [err14];
    } else {
      vErrors.push(err14);
    }
    errors++;
    validate24.errors = vErrors;
    return false;
  } else {
    errors = _errs1;
    if (vErrors !== null) {
      if (_errs1) {
        vErrors.length = _errs1;
      } else {
        vErrors = null;
      }
    }
  }
  validate24.errors = vErrors;
  return errors === 0;
}
function validate23(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {}
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.id !== undefined) {
        const _errs1 = errors;
        if (typeof data.id !== "string") {
          validate23.errors = [
            {
              instancePath: instancePath + "/id",
              schemaPath: "#/properties/id/type",
              keyword: "type",
              params: { type: "string" },
              message: "must be string",
            },
          ];
          return false;
        }
        var valid0 = _errs1 === errors;
      } else {
        var valid0 = true;
      }
      if (valid0) {
        if (data.event !== undefined) {
          const _errs3 = errors;
          if (
            !validate24(data.event, {
              instancePath: instancePath + "/event",
              parentData: data,
              parentDataProperty: "event",
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate24.errors
                : vErrors.concat(validate24.errors);
            errors = vErrors.length;
          }
          var valid0 = _errs3 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.pythonCode !== undefined) {
            const _errs4 = errors;
            if (typeof data.pythonCode !== "string") {
              validate23.errors = [
                {
                  instancePath: instancePath + "/pythonCode",
                  schemaPath: "#/properties/pythonCode/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid0 = _errs4 === errors;
          } else {
            var valid0 = true;
          }
        }
      }
    } else {
      validate23.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate23.errors = vErrors;
  return errors === 0;
}
function validate22(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {}
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.id !== undefined) {
        const _errs1 = errors;
        if (typeof data.id !== "string") {
          validate22.errors = [
            {
              instancePath: instancePath + "/id",
              schemaPath: "#/properties/id/type",
              keyword: "type",
              params: { type: "string" },
              message: "must be string",
            },
          ];
          return false;
        }
        var valid0 = _errs1 === errors;
      } else {
        var valid0 = true;
      }
      if (valid0) {
        if (data.kind !== undefined) {
          let data1 = data.kind;
          const _errs3 = errors;
          if (typeof data1 !== "string") {
            validate22.errors = [
              {
                instancePath: instancePath + "/kind",
                schemaPath: "#/$defs/ActorKind/type",
                keyword: "type",
                params: { type: "string" },
                message: "must be string",
              },
            ];
            return false;
          }
          if (!(data1 === "sprite" || data1 === "stage")) {
            validate22.errors = [
              {
                instancePath: instancePath + "/kind",
                schemaPath: "#/$defs/ActorKind/enum",
                keyword: "enum",
                params: { allowedValues: schema25.enum },
                message: "must be equal to one of the allowed values",
              },
            ];
            return false;
          }
          var valid0 = _errs3 === errors;
        } else {
          var valid0 = true;
        }
        if (valid0) {
          if (data.name !== undefined) {
            const _errs6 = errors;
            if (typeof data.name !== "string") {
              validate22.errors = [
                {
                  instancePath: instancePath + "/name",
                  schemaPath: "#/properties/name/type",
                  keyword: "type",
                  params: { type: "string" },
                  message: "must be string",
                },
              ];
              return false;
            }
            var valid0 = _errs6 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.handlers !== undefined) {
              let data3 = data.handlers;
              const _errs8 = errors;
              if (errors === _errs8) {
                if (Array.isArray(data3)) {
                  var valid2 = true;
                  const len0 = data3.length;
                  for (let i0 = 0; i0 < len0; i0++) {
                    const _errs10 = errors;
                    if (
                      !validate23(data3[i0], {
                        instancePath: instancePath + "/handlers/" + i0,
                        parentData: data3,
                        parentDataProperty: i0,
                        rootData,
                      })
                    ) {
                      vErrors =
                        vErrors === null
                          ? validate23.errors
                          : vErrors.concat(validate23.errors);
                      errors = vErrors.length;
                    }
                    var valid2 = _errs10 === errors;
                    if (!valid2) {
                      break;
                    }
                  }
                } else {
                  validate22.errors = [
                    {
                      instancePath: instancePath + "/handlers",
                      schemaPath: "#/properties/handlers/type",
                      keyword: "type",
                      params: { type: "array" },
                      message: "must be array",
                    },
                  ];
                  return false;
                }
              }
              var valid0 = _errs8 === errors;
            } else {
              var valid0 = true;
            }
          }
        }
      }
    } else {
      validate22.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate22.errors = vErrors;
  return errors === 0;
}
function validate21(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {}
) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      if (data.actors !== undefined) {
        let data0 = data.actors;
        const _errs1 = errors;
        if (errors === _errs1) {
          if (Array.isArray(data0)) {
            var valid1 = true;
            const len0 = data0.length;
            for (let i0 = 0; i0 < len0; i0++) {
              const _errs3 = errors;
              if (
                !validate22(data0[i0], {
                  instancePath: instancePath + "/actors/" + i0,
                  parentData: data0,
                  parentDataProperty: i0,
                  rootData,
                })
              ) {
                vErrors =
                  vErrors === null
                    ? validate22.errors
                    : vErrors.concat(validate22.errors);
                errors = vErrors.length;
              }
              var valid1 = _errs3 === errors;
              if (!valid1) {
                break;
              }
            }
          } else {
            validate21.errors = [
              {
                instancePath: instancePath + "/actors",
                schemaPath: "#/properties/actors/type",
                keyword: "type",
                params: { type: "array" },
                message: "must be array",
              },
            ];
            return false;
          }
        }
      }
    } else {
      validate21.errors = [
        {
          instancePath,
          schemaPath: "#/type",
          keyword: "type",
          params: { type: "object" },
          message: "must be object",
        },
      ];
      return false;
    }
  }
  validate21.errors = vErrors;
  return errors === 0;
}
function validate20(
  data,
  { instancePath = "", parentData, parentDataProperty, rootData = data } = {}
) {
  let vErrors = null;
  let errors = 0;
  if (!(data && typeof data == "object" && !Array.isArray(data))) {
    validate20.errors = [
      {
        instancePath,
        schemaPath: "#/type",
        keyword: "type",
        params: { type: "object" },
        message: "must be object",
      },
    ];
    return false;
  }
  const _errs1 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs2 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing0;
    if (
      (data.kind === undefined && (missing0 = "kind")) ||
      (data.text === undefined && (missing0 = "text"))
    ) {
      const err0 = {
        instancePath,
        schemaPath: "#/oneOf/0/required",
        keyword: "required",
        params: { missingProperty: missing0 },
        message: "must have required property '" + missing0 + "'",
      };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    } else {
      if (data.kind !== undefined) {
        const _errs3 = errors;
        if ("flat" !== data.kind) {
          const err1 = {
            instancePath: instancePath + "/kind",
            schemaPath: "#/oneOf/0/properties/kind/const",
            keyword: "const",
            params: { allowedValue: "flat" },
            message: "must be equal to constant",
          };
          if (vErrors === null) {
            vErrors = [err1];
          } else {
            vErrors.push(err1);
          }
          errors++;
        }
        var valid1 = _errs3 === errors;
      } else {
        var valid1 = true;
      }
      if (valid1) {
        if (data.text !== undefined) {
          const _errs4 = errors;
          if (typeof data.text !== "string") {
            const err2 = {
              instancePath: instancePath + "/text",
              schemaPath: "#/oneOf/0/properties/text/type",
              keyword: "type",
              params: { type: "string" },
              message: "must be string",
            };
            if (vErrors === null) {
              vErrors = [err2];
            } else {
              vErrors.push(err2);
            }
            errors++;
          }
          var valid1 = _errs4 === errors;
        } else {
          var valid1 = true;
        }
      }
    }
  }
  var _valid0 = _errs2 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
  }
  const _errs6 = errors;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    let missing1;
    if (
      (data.kind === undefined && (missing1 = "kind")) ||
      (data.program === undefined && (missing1 = "program"))
    ) {
      const err3 = {
        instancePath,
        schemaPath: "#/oneOf/1/required",
        keyword: "required",
        params: { missingProperty: missing1 },
        message: "must have required property '" + missing1 + "'",
      };
      if (vErrors === null) {
        vErrors = [err3];
      } else {
        vErrors.push(err3);
      }
      errors++;
    } else {
      if (data.kind !== undefined) {
        const _errs7 = errors;
        if ("per-method" !== data.kind) {
          const err4 = {
            instancePath: instancePath + "/kind",
            schemaPath: "#/oneOf/1/properties/kind/const",
            keyword: "const",
            params: { allowedValue: "per-method" },
            message: "must be equal to constant",
          };
          if (vErrors === null) {
            vErrors = [err4];
          } else {
            vErrors.push(err4);
          }
          errors++;
        }
        var valid2 = _errs7 === errors;
      } else {
        var valid2 = true;
      }
      if (valid2) {
        if (data.program !== undefined) {
          const _errs8 = errors;
          if (
            !validate21(data.program, {
              instancePath: instancePath + "/program",
              parentData: data,
              parentDataProperty: "program",
              rootData,
            })
          ) {
            vErrors =
              vErrors === null
                ? validate21.errors
                : vErrors.concat(validate21.errors);
            errors = vErrors.length;
          }
          var valid2 = _errs8 === errors;
        } else {
          var valid2 = true;
        }
      }
    }
  }
  var _valid0 = _errs6 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
    }
  }
  if (!valid0) {
    const err5 = {
      instancePath,
      schemaPath: "#/oneOf",
      keyword: "oneOf",
      params: { passingSchemas: passing0 },
      message: "must match exactly one schema in oneOf",
    };
    if (vErrors === null) {
      vErrors = [err5];
    } else {
      vErrors.push(err5);
    }
    errors++;
    validate20.errors = vErrors;
    return false;
  } else {
    errors = _errs1;
    if (vErrors !== null) {
      if (_errs1) {
        vErrors.length = _errs1;
      } else {
        vErrors = null;
      }
    }
  }
  validate20.errors = vErrors;
  return errors === 0;
}
