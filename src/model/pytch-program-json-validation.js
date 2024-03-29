/* eslint-disable */

/* This file is auto-generated. */
/* See refresh-pytch-program-json-validation.sh for the gory details. */

"use strict";
export const validate = validate20;
// module.exports.default = validate20;
const schema22 = {
  type: "object",
  oneOf: [
    {
      properties: { kind: { const: "flat" }, text: { type: "string" } },
      required: ["kind", "text"],
    },
  ],
};
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
  if (!valid0) {
    const err3 = {
      instancePath,
      schemaPath: "#/oneOf",
      keyword: "oneOf",
      params: { passingSchemas: passing0 },
      message: "must match exactly one schema in oneOf",
    };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
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
