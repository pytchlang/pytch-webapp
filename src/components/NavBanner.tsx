import React, { useEffect, useState } from "react";
import { envVarOrDefault, withinSite } from "../env-utils";
import { Link } from "./LinkWithinApp";
import { pytchResearchSiteUrl } from "../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";

import "../pytch-navbar.scss";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

import pytchLogo from "../images/pytch.png";
import { ExternalLinkIndicator } from "./decorations";
import { NavDropdown } from "react-bootstrap";

export const NavBanner = () => {
  const [menuIsExpanded, setMenuIsExpanded] = useState(false);
  const menuRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const menuDiv = menuRef.current;
    if (menuDiv == null) return;

    let resizeObserver: ResizeObserver | null = new ResizeObserver(() => {
      const menuDisplay = window
        .getComputedStyle(menuDiv)
        .getPropertyValue("display");

      if (menuIsExpanded && menuDisplay === "none") {
        setMenuIsExpanded(false);
      }
    });

    resizeObserver.observe(menuDiv);

    return () => {
      resizeObserver?.disconnect();
      resizeObserver = null;
    };
  });

  const ulClass = classNames({ menuIsExpanded });
  const toggleMenu = () => {
    setMenuIsExpanded(!menuIsExpanded);
  };

  const burgerIcon: IconProp = menuIsExpanded ? "xmark" : "bars";
  const burgerClass = classNames(
    "bg-transparent border-0 burger-menu",
    menuIsExpanded ? "is-expanded" : "is-collapsed"
  );

  return (
    <div className="NavBar">
      <div className="NavBarContent">
        <div className="title-and-version">
          <Link to="/">
            <img
              className="home-link"
              src={pytchLogo}
              alt="Pytch Logo"
              height="70"
            />
          </Link>
        </div>
        <button className={burgerClass} onClick={toggleMenu} ref={menuRef}>
          <FontAwesomeIcon icon={burgerIcon} />
        </button>
        <ul className={ulClass}>
          <li>
            <a href={pytchResearchSiteUrl}>
              About
              <ExternalLinkIndicator />
            </a>
          </li>
          <li>
            <a href={`${pytchResearchSiteUrl}lesson-plans`}>
              Lesson plans
              <ExternalLinkIndicator />
            </a>
          </li>
          <li>
            <a href={withinSite("/doc/index.html")}>Help</a>
          </li>
          <li>
            <NavDropdown title="Explore" id="basic-nav-dropdown">
              <NavDropdown.Item as={Link} to={"/tutorials/"}>
                Tutorials
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to={"/demos/"}>
                Demos
              </NavDropdown.Item>
            </NavDropdown>
          </li>
          <li>
            <Link to="/my-projects/">My projects</Link>
          </li>
          <li>
            <Link
              className="contact-us-link"
              to="/#contact-info"
              onClick={() => setMenuIsExpanded(false)}
            >
              <FontAwesomeIcon icon={["far", "envelope"]} />
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

/** The `InertNavBanner` can be used when we want something across the
 * top, but where the user should not be able to router-navigate
 * anywhere.  (A true navigation is OK, which we allow via <a>.)  Used
 * in the "start tutorial at chapter" pseudo-modal flow. */
export const InertNavBanner = () => {
  return (
    <div className="NavBar inert">
      <div className="NavBarContent">
        <div className="title-and-version" style={{ margin: "auto" }}>
          <a href={envVarOrDefault("BASE_URL", "https://pytch.org/")}>
            <img
              className="home-link"
              src={pytchLogo}
              alt="Pytch Logo"
              height="70"
            />
          </a>
        </div>
      </div>
    </div>
  );
};
