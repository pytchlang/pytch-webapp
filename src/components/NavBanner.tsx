import React from "react";
import { envVarOrFail, withinSite } from "../env-utils";
import { Link } from "./LinkWithinApp";

const NavBanner = () => {
  const versionTag = envVarOrFail("VITE_VERSION_TAG");
  return (
    <div className="NavBar">
      <div className="title-and-version">
        <Link to="/">
          <h1>
            Pytch <span className="beta-tag">BETA</span>
          </h1>
        </Link>
        <p className="version-tag">
          <a href={withinSite("/doc/releases/changelog.html")}>{versionTag}</a>
        </p>
      </div>
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
