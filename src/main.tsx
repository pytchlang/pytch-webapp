import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { StoreProvider } from "easy-peasy";
import store from "./store";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const rootElt = document.getElementById("root")!;
const root = createRoot(rootElt);
root.render(
  <React.StrictMode>
    <StoreProvider store={store}>
      <App />
    </StoreProvider>
  </React.StrictMode>
);
