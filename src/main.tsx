import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { StoreProvider } from "easy-peasy";
import store from "./store";
import { envVarMap } from "./env-utils";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// This is a bit repetitive, but Vite does not support dynamic expansion
// of env.vars.  Gather all the ones we use in one place, ready for
// populating the map relied on by the rest of the app.
envVarMap.populate([
  ["BASE_URL", import.meta.env.BASE_URL],
  ["VITE_STATIC_BLOBS_BASE", import.meta.env.VITE_STATIC_BLOBS_BASE],
  ["VITE_DEMOS_BASE", import.meta.env.VITE_DEMOS_BASE],
  ["VITE_DEPLOY_BASE_URL", import.meta.env.VITE_DEPLOY_BASE_URL],
  ["VITE_LIVE_RELOAD_WEBSOCKET", import.meta.env.VITE_LIVE_RELOAD_WEBSOCKET],
  ["VITE_GOOGLE_API_KEY", import.meta.env.VITE_GOOGLE_API_KEY],
  ["VITE_GOOGLE_APP_ID", import.meta.env.VITE_GOOGLE_APP_ID],
  ["VITE_GOOGLE_CLIENT_ID", import.meta.env.VITE_GOOGLE_CLIENT_ID],
  ["VITE_MEDIALIB_BASE", import.meta.env.VITE_MEDIALIB_BASE],
  ["VITE_SKULPT_BASE", import.meta.env.VITE_SKULPT_BASE],
  ["VITE_TUTORIALS_BASE", import.meta.env.VITE_TUTORIALS_BASE],
  ["VITE_DEMO_CATALOGUE_BASE", import.meta.env.VITE_DEMO_CATALOGUE_BASE],
  ["VITE_LESSON_SPECIMENS_BASE", import.meta.env.VITE_LESSON_SPECIMENS_BASE],
  ["VITE_USE_REAL_GOOGLE_DRIVE", import.meta.env.VITE_USE_REAL_GOOGLE_DRIVE],
  ["VITE_VERSION_TAG", import.meta.env.VITE_VERSION_TAG],
  ["BACKEND_URL", import.meta.env.VITE_BACKEND_URL],
]);

console.log('avatar', envVarMap);

const rootElt = document.getElementById("root")!;
const root = createRoot(rootElt);
root.render(
  <React.StrictMode>
    <StoreProvider store={store}>
      <DndProvider backend={HTML5Backend}>
        <App />
      </DndProvider>
    </StoreProvider>
  </React.StrictMode>
);
