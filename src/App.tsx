import React from 'react';
import { Router } from "@reach/router";
import Welcome from "./components/Welcome";
import ProjectList from "./components/ProjectList";

import "./pytch.scss";
import { AllModals } from './components/AllModals';

function App() {
  return (
    <>
    <Router className="App">
      <Welcome path="/"/>
      <ProjectList path="/my-projects/"/>
    </Router>
    <AllModals/>
    </>
  );
}

export default App;
