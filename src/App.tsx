import React from "react";
import { Router } from "@reach/router";
import Welcome from "./components/Welcome";
import ProjectList from "./components/ProjectList";
import TutorialList from "./components/TutorialList";
import IDE from "./components/IDE";

import "./pytch.scss";
import "./pytch-ide.scss";

import { AllModals } from "./components/AllModals";

function App() {
  return (
    <>
      <Router className="App">
        <Welcome path="/" />
        <ProjectList path="/my-projects/" />
        <TutorialList path="/tutorials/" />
        <IDE path="/ide/:projectIdString" />
      </Router>
      <AllModals />
    </>
  );
}

export default App;
