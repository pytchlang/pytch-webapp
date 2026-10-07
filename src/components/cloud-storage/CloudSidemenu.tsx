import {Link, useLocation} from "react-router-dom";
import React, {useEffect} from "react";
import {ListGroup} from "react-bootstrap";
import "./pytch-cloud.scss";

export default function CloudSidemenu() {
    const location = useLocation();
    useEffect(() => {
        console.log(location.pathname);
    }, []);

    return (
        <ListGroup className={"cloud-sidemenu"}>
            <ListGroup.Item active={location.pathname === "/profile"}>
                <Link to={"/profile"}>Profile</Link>
            </ListGroup.Item>
            <ListGroup.Item active={location.pathname === "/manage-students"}>
                <Link to={"/manage-students"}>Manage students</Link>
            </ListGroup.Item>
            <ListGroup.Item className={"settings-submenu"}>
                <p>Settings</p>
                <ListGroup>
                    <ListGroup.Item active={location.pathname === "settings/edit-profile"}>
                        <Link to={"/settings/edit-profile"}>Edit Profile</Link>
                    </ListGroup.Item>
                    <ListGroup.Item active={location.pathname === "settings/change-email"}>
                        <Link to={"/settings/change-email"}>Change E-Mail</Link>
                    </ListGroup.Item>
                    <ListGroup.Item active={location.pathname === "settings/change-password"}>
                        <Link to={"/settings/change-password"}>Change Password</Link>
                    </ListGroup.Item>
                </ListGroup>
            </ListGroup.Item>
        </ListGroup>
    )
}