import React from "react";
import { Link } from "./LinkWithinApp";

const NavBanner = () => {
  return (
    <div className="NavBar">
      <Link to="/">
        <h1>Pytch</h1>
      </Link>
      <ul>
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
