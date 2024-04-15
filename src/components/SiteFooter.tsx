import React from "react";
import { envVarOrFail, withinSite } from "../env-utils";
import { Link } from "./LinkWithinApp";
import { pytchResearchSiteUrl } from "../constants";
import { urlWithinApp } from "../env-utils";


const SiteFooter = () => {
    const sfi_logo = urlWithinApp("/assets/logos/sfi_logo.png");
    const tcd_logo = urlWithinApp("/assets/logos/tcd_logo.png");
    const tudublin_logo = urlWithinApp("/assets/logos/tudublin_logo.png");
    return (
              <footer className="site-footer">
          <div className="section-content">
            <div className="sitemap">
              <div className="list-container">
                <h2>
                  Contact us<span role="presentation">_</span>
                </h2>
                <ul>
                  <li>
                    <a href="mailto:info@pytch.org">Email</a>
                  </li>
                  <li>
                    <a href="https://twitter.com/pytchlang/">Twitter</a>
                  </li>
                </ul>
              </div>
              <div className="list-container">
                <h2>
                  About<span role="presentation">_</span>
                </h2>
                <ul>
                  <li>
                    <a href="https://pytch.scss.tcd.ie/who-we-are/">Our team</a>
                  </li>
                  <li>
                    <a href="https://pytch.scss.tcd.ie/research/">Our research</a>
                  </li>
                </ul>
              </div>
              <div className="list-container">
                <h2>
                  For teachers<span role="presentation">_</span>
                </h2>
                <ul>
                  <li><Link to="/tutorials/">Tutorials</Link></li>
                  <li>
                    <a href="https://pytch.scss.tcd.ie/lesson-plans/">Lesson plans</a>
                  </li>
                </ul>
              </div>
              {/*
    <div class="list-container">
      <h2>Resources<span role="presentation">_</span></h2>
      <ul>
        <li><a href="https://www.pytch.org/doc/developer.html">Info for developers</a></li>
        <li><a href="https://www.pytch.org/doc/webapp/user/index.html">Help</a></li>
      </ul>
    </div>
    */}
            </div>
            <div className="section-images">
              <img src={sfi_logo} alt="Science Foundation Ireland" />
              <img src={tcd_logo} alt="Trinity College Dublin" />
              <img src={tudublin_logo} alt="TUDublin" />

            </div>
          </div>
        </footer>
  
    );
  };
  
  export default SiteFooter;
  