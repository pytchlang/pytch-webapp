import {NavBanner} from "../NavBanner";
import {Button, Col, Container, Row} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {useNavigate} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {getUserProfile, signOutUser} from "../../model/cloud-storage";
import {useTranslation} from "react-i18next";
import CloudSidemenu from "./CloudSidemenu";

export default function ChangeEmail() {
    const [userProfile, setUserProfile] = useState(undefined);

    async function fetchUser() {
        try
        {
            const data = await getUserProfile();
            console.log("user profile", data);
            setUserProfile(data);
        }
        catch(err) {
            console.error(err);
            setUserProfile(null);
            signOutUser();
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
                                    <h1>Change E-Mail</h1>
                                    <Form className={"bg-white rounded-3 p-4"}>
                                        <Form.Group controlId="formGroupPassword" className={"mt-3"}>
                                            <Form.Label>Password</Form.Label>
                                            <Form.Control type="password" placeholder="Password" />
                                        </Form.Group>
                                        <Form.Group controlId="formGroupNewEmail" className={"mt-3"}>
                                            <Form.Label>New E-Mail</Form.Label>
                                            <Form.Control type="email" placeholder="Enter new email" />
                                        </Form.Group>
                                        <Button type={"submit"} className={"mt-3 w-100 py-3"}>Send verification code</Button>
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