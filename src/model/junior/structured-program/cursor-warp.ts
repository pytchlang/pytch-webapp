// Warping cursor to error in currently-not-focused actor.
//
// Has the user clicked on a "go to location" button?  Sometimes this
// will involve selecting a different Actor, in which case we have to
// store somewhere the fact that we want to warp the relevant Ace cursor
// once that AceEditor has been loaded.

import { Uuid } from "./core-types";
