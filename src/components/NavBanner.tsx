import React, { useEffect } from 'react';
import { envVarOrFail, withinSite } from "../env-utils";
import { Link } from "./LinkWithinApp";


const NavBanner = () => {

  useEffect(() => {
    function toggleNav() {
      const navUl = document.querySelector("nav ul");
      if (navUl) {
        navUl.classList.toggle("show");
      }
    }

    const hamburgerMenu = document.querySelector(".hamburger-menu");
    if (hamburgerMenu) {
      hamburgerMenu.addEventListener("click", toggleNav);
    }

    return () => {
      if (hamburgerMenu) {
        hamburgerMenu.removeEventListener("click", toggleNav);
      }
    };
  }, []); // run only once on mount


  return (
    <nav>
      <div className="title-and-version">
        <h1>
          <a href="/" style={{ color: "white !important" }}>
            Pytch
          </a>
        </h1>
        {/* {<a className="version-tag" href={withinSite("/doc/releases/changelog.html")}>
          v2.0.0
        </a>} */}
      </div>
      <div
        className="hamburger-menu"

        aria-label="click here for navigation menu"
      >
        <div /> {/*<!-- This produces the horizontal bars -->*/}
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
        <li>
          <Link to="/tutorials/">Tutorials</Link>
        </li>
        <li>
          <a href="https://pytch.scss.tcd.ie/lesson-plans/">Lesson plans</a>
        </li>
        <li>
          <Link to="/my-projects/">My projects</Link>
        </li>
        <li className="mail">&#x2709;</li>
      </ul>
    </nav>
  );
};

export default NavBanner;
