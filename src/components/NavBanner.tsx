import React from "react";
import { withinSite } from "../utils";
import { Link } from "./LinkWithinApp";

const NavBanner = () => {
  return (
    <div className="NavBar">
      <Link to="/">
        <h1>Pytch</h1>
      </Link>
      <ul>
        <a href={withinSite("/doc/index.html")}>
          <li>Help</li>
        </a>
        <Link to="/tutorials/">
          <li>Tutorials</li>
        </Link>
        <Link to="/my-projects/">
          <li>My projects</li>
        </Link>
      </ul>
    </div>
  );
};

export default NavBanner;
