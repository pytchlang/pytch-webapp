import React from 'react';
import { Router } from "@reach/router";
import Welcome from "./components/Welcome";

import './App.css';

function App() {
  return (
    <Router className="App">
      <Welcome path="/"/>
    </Router>
  );
}

export default App;
