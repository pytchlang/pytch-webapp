import {NavBanner} from "../NavBanner";
import {Button, Col, Container, Row} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {useNavigate} from "react-router-dom";
import React, {useEffect} from "react";
import {getUserProfile} from "../../model/cloud-storage";
import {useTranslation} from "react-i18next";
import CloudSidemenu from "./CloudSidemenu";

export default function ChangePassword() {

    function getUserProjects() {
        console.log("getting user projects");

        fetch("http://127.0.0.1:8000/api/user-profile/projects", {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
            }
        })
        .then(res => {
            if (res.ok) {
                return res.json();
            }
            else {
                throw new Error("Could not get user profile data");
            }
        })
        .then(data => {
            console.log("user projects", data.data);
        })
        .catch(err => {
            console.error(err);
            navigate("/");
        })
    }

    async function fetchUser() {
        try
        {
            const data = await getUserProfile();
            console.log("user profile", data);
            getUserProjects();
        }
        catch(err) {
            console.error(err);
            // localStorage.removeItem("token");
            navigate("/");
        }
    }


    const navigate = useNavigate();
    const { t } = useTranslation("tutorials");

    useEffect(() => {
        fetchUser()

    }, [])

    return (
        <>
            <NavBanner />
            <Container className={"mx-auto mt-5"}>
                <Row>
                    <Col xs={2}>
                        <CloudSidemenu/>
                    </Col>
                    <Col>
                        <Container>
                            <Row>
                                <Col>
                                    <h1>Change Password</h1>
                                    <Form className={"bg-white rounded-3 p-4"}>
                                        <Form.Group controlId="formGroupPassword">
                                            <Form.Label>Old Password</Form.Label>
                                            <Form.Control type="password" placeholder="Password" />
                                        </Form.Group>
                                        <Form.Group controlId="formGroupPassword" className={"mt-3"}>
                                            <Form.Label>New Password</Form.Label>
                                            <Form.Control type="password" placeholder="Password" />
                                        </Form.Group>
                                        <Form.Group controlId="formGroupPassword" className={"mt-3"}>
                                            <Form.Label>Confirm New Password</Form.Label>
                                            <Form.Control type="password" placeholder="Password" />
                                        </Form.Group>
                                        <Button type={"submit"} className={"mt-3 w-100 py-3"}>Change Password</Button>
                                    </Form>
                                </Col>
                            </Row>
                        </Container>
                    </Col>
                </Row>
            </Container>
        </>
    )
}