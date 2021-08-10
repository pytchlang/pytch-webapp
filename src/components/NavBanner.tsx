import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { studyEnabled } from "../database/study-server";
import { useStoreActions } from "../store";
import { withinSite } from "../utils";
import { Link } from "./LinkWithinApp";

const versionTag = process.env.REACT_APP_VERSION_TAG;

const NavBanner = () => {
  const signOut = useStoreActions(
    (actions) => actions.sessionState.signOutSession
  );

  const maybeSignOut = studyEnabled && (
    <li className="slightly-prominent" onClick={() => signOut()}>
      <FontAwesomeIcon icon="sign-out-alt" /> Sign out of study
    </li>
  );

  return (
    <div className="NavBar">
      <div className="title-and-version">
        <Link to="/">
          <h1>Pytch</h1>
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
        {maybeSignOut}
      </ul>
    </div>
  );
};

export default NavBanner;
