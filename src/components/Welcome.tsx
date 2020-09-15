import React from "react";
import { RouteComponentProps } from "@reach/router";
import NavBanner from "./NavBanner";
import Button from "react-bootstrap/Button";
import { Link } from "./LinkWithinApp";

const Welcome: React.FC<RouteComponentProps> = () => {
  return (
    <>
      <NavBanner />
      <div className="welcome-text">
        <h1>Get started!</h1>
        <div className="nav-buttons">
          <Link to="/tutorials/">
            <Button>Learn about Pytch from a tutorial</Button>
          </Link>
          <Link to="/my-projects/">
            <Button>Work on one of your projects</Button>
          </Link>
          <div className="about-pytch">
            <h2>About Pytch</h2>
            <p>
              This is an early testing version of Pytch, a system for helping
              people familiar with{" "}
              <a href="https://mit.scratch.edu/">MIT's Scratch</a> to learn{" "}
              <a href="https://www.python.org/">Python</a>. Many thanks to the
              Scratch team for the ideas and inspiration, and to the{" "}
              <a href="https://skulpt.org/">Skulpt</a> team for the JavaScript
              Python implementation on which Pytch builds. The Skulpt code is
              used under the{" "}
              <a href="https://opensource.org/licenses/mit-license.php">
                MIT licence
              </a>
              . In the tutorials, we use ideas, artwork, and audio from the book{" "}
              <a href="https://wireframe.raspberrypi.org/books/code-the-classics1">
                Code the Classics, vol.1
              </a>
              , published by Raspberry Pi Trading Ltd. We use this content under
              the{" "}
              <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/">
                Creative Commons BY-NC-SA 3.0 licence
              </a>
              . We have made minor changes to some artwork, for example resizing
              or cropping it. Many thanks to Raspberry Pi Trading Ltd for making
              their content available (
              <a href="https://github.com/Wireframe-Magazine/Code-the-Classics">
                on GitHub
              </a>
              ) in this way.
            </p>

            <h2>Contact</h2>

            <p>
              Please email us at{" "}
              <a href="mailto:info@pytch.org">
                <code>info@pytch.org</code>
              </a>{" "}
              with any feedback or questions.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Welcome;
