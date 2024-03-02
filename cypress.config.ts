import { defineConfig } from "cypress";

export default defineConfig({
  video: false,
  numTestsKeptInMemory: 0,
  viewportWidth: 1280,
  viewportHeight: 1024,
  defaultCommandTimeout: 10000,
  e2e: {
    testIsolation: false,
    experimentalRunAllSpecs: true,
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require("./cypress/plugins/index.js")(on, config);
    },
    baseUrl: "http://localhost:3000",
    excludeSpecPattern: ["*.js~"],
  },
});
