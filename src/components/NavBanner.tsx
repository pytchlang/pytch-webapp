import React from "react"
import { Link } from "@reach/router";

const NavBanner = () => {
    return (
        <div className="NavBar">
            <Link to="/"><h1>Pytch</h1></Link>
            <ul>
                <Link to="/my-projects/"><li>My projects</li></Link>
            </ul>
        </div>
    );
};

export default NavBanner;
