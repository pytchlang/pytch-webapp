/** This is a quite ad-hoc.  We have copied and pasted an existing theme
 * JavaScript file, and then copied and pasted in the rendered CSS from
 * the source SCSS file (src/ace-theme-pytch.scss).  The rendered file
 * also exists (tools/ace-theme-contrasts/ace-theme-pytch.css).  If it
 * becomes cumbersom to keep all this in sync we can look into a system
 * which has just one source of truth.
 *
 * To render, run:
 *
 *   cd $REPO_ROOT
 *   npx sass src/ace-theme-pytch.scss > tools/ace-theme-contrasts/ace-theme-pytch.css
 *
 * and then copy/paste the CSS into this file as the `` string.
 *
 * See also the map in src/model/highlight-as-ace.ts, which ALSO needs to
 * be kept in sync.
 */

/* eslint-disable no-undef */

ace.define(
  "ace/theme/pytch-css",
  ["require", "exports", "module"],
  function (require, exports, module) {
    module.exports = `.ace-pytch {
  background-color: white;
  color: black;
}
.ace-pytch .ace_gutter {
  background: #ececec;
  color: #333;
}
.ace-pytch .ace_print-margin {
  width: 1px;
  background: #e8e8e8;
}
.ace-pytch .ace_fold {
  background-color: #306998;
}
.ace-pytch .ace_cursor {
  color: black;
}
.ace-pytch .ace_invisible {
  color: rgb(191, 191, 191);
}
.ace-pytch .ace_indent-guide,
.ace-pytch .ace_indent-guide-active {
  background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjePHixX8ACSwDuE5Z3xUAAAAASUVORK5CYII=") right repeat-y;
}
.ace-pytch .ace_marker-layer .ace_selection {
  background: #c8e6ff;
}
.ace-pytch .ace_multiselect .ace_selection.ace_start {
  box-shadow: 0 0 3px 0px white;
}
.ace-pytch .ace_marker-layer .ace_step {
  background: rgb(247, 237, 137);
}
.ace-pytch .ace_marker-layer .ace_stack {
  background: #bae0a0;
}
.ace-pytch .ace_marker-layer .ace_bracket {
  margin: -1px 0 0 -1px;
  border: 1px solid rgb(192, 192, 192);
}
.ace-pytch.ace_focus .ace_marker-layer .ace_active-line {
  background: #fcfce8;
}
.ace-pytch .ace_gutter-active-line {
  background-color: #e5e5e5;
}
.ace-pytch .ace_marker-layer .ace_selected-word {
  background: rgb(250, 250, 255);
  border: 1px solid rgb(200, 200, 250);
}
.ace-pytch .ace_storage,
.ace-pytch .ace_keyword,
.ace-pytch .ace_keyword.ace_operator,
.ace-pytch .ace_punctuation,
.ace-pytch .ace_paren {
  color: black;
  font-weight: bold;
}
.ace-pytch .ace_constant,
.ace-pytch .ace_constant.ace_buildin,
.ace-pytch .ace_constant.ace_language,
.ace-pytch .ace_constant.ace_library,
.ace-pytch .ace_constant.ace_numeric {
  color: #306998;
}
.ace-pytch .ace_support.ace_function {
  color: #bb5300;
}
.ace-pytch .ace_string {
  color: #b94887;
}
.ace-pytch .ace_comment {
  font-style: italic;
  color: #00835f;
}
.ace-pytch .ace_entity.ace_name.ace_function {
  color: #bb5300;
  font-weight: bold;
}
.ace-pytch .ace_variable.ace_language {
  color: #306998;
}
.ace-pytch .ace_support.ace_constant {
  color: rgb(6, 150, 14);
}
.ace-pytch .ace_support.ace_type,
.ace-pytch .ace_support.ace_class {
  color: rgb(109, 121, 222);
}
.ace-pytch .ace_invalid {
  background-color: rgba(255, 0, 0, 0.1);
  color: red;
}
.ace-pytch .ace_comment.ace_doc {
  color: rgb(0, 102, 255);
}
.ace-pytch .ace_comment.ace_doc.ace_tag {
  color: rgb(128, 159, 191);
}
.ace-pytch .ace_xml-pe {
  color: rgb(104, 104, 91);
}
.ace-pytch .ace_heading {
  color: rgb(12, 7, 255);
}
.ace-pytch .ace_list {
  color: rgb(185, 6, 144);
}
.ace-pytch .ace_meta.ace_tag {
  color: rgb(0, 22, 142);
}
.ace-pytch .ace_string.ace_regex {
  color: rgb(255, 0, 0);
}
`;
  }
);

ace.define(
  "ace/theme/pytch",
  ["require", "exports", "module", "ace/theme/pytch-css", "ace/lib/dom"],
  function (require, exports, _module) {
    "use strict";
    exports.isDark = false;
    exports.cssClass = "ace-pytch";
    exports.cssText = require("./pytch-css");
    var dom = require("../lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass);
  }
);

(function () {
  ace.require(["ace/theme/pytch"], function (m) {
    if (typeof module === "object" && typeof exports === "object" && module) {
      module.exports = m;
    }
  });
})();
