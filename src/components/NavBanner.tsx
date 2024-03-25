import React from "react";
import { envVarOrFail, withinSite } from "../env-utils";
import { Link } from "./LinkWithinApp";
import { pytchResearchSiteUrl } from "../constants";

const NavBanner = () => {
  const versionTag = envVarOrFail("VITE_VERSION_TAG");
  return (
<nav>
   <div className="title-and-version">
     <h1>
       <a href="/app/" style={{ color: "white !important" }}>
         Pytch
       </a>
     </h1>
     <a className="version-tag" href={withinSite("/doc/releases/changelog.html")}>
       v1.11.1
     </a>
   </div>
   <div
     className="hamburger-menu"
     
     aria-label="click here for navigation menu"
   >
     <div />
     <div />
     <div />
   </div>
   <ul>
     <li>
       <a href={withinSite("https://pytch.scss.tcd.ie/")}>About... </a>
     </li>
     <li>
       <a href={withinSite("/doc/index.html")}>Help/Info?</a>
     </li>
     <Link to="/tutorials/">
      <li>Tutorials</li>
    </Link>
     <li>
       <a href="https://pytch.scss.tcd.ie/lesson-plans/">Lesson plans</a>
     </li>
     <Link to="/my-projects/">
        <li>My projects</li>
      </Link>
     <li className="mail">✉</li>
   </ul>
 </nav>
 
  );
};

export default NavBanner;
