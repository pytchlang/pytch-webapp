import React from "react"
import { Link } from "@reach/router";

const NavBanner = () => {
    return (
        <div className="NavBar">
            <h1><Link to="/">Pytch</Link></h1>
            <ul>
                <li><Link to="/my-projects/">My projects</Link></li>
            </ul>
        </div>
    );
};

export default NavBanner;
