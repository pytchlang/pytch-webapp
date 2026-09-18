import {NavBanner} from "../NavBanner";
import {Button, Col, Container, Row} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {Link, useNavigate} from "react-router-dom";
import React, {useEffect, useRef, useState} from "react";
import {getUserProfile} from "../../model/cloud-storage";
import {useTranslation} from "react-i18next";
import Modal from 'react-bootstrap/Modal';
import CloudSidemenu from "./CloudSidemenu";

export default function EditProfile() {
    const [userProfile, setUserProfile] = useState(undefined);
    const [userProjects, setUserProjects] = useState(undefined);
    const fileRef = useRef(null);

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
            setUserProjects(null);
            sessionStorage.removeItem("token");
            navigate("/");
        }
    }

    const navigate = useNavigate();
    const { t } = useTranslation("tutorials");

    useEffect(() => {
        fetchUser()

    }, [])

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <>
            <NavBanner />

            <Container className={"mx-auto mt-5"}>
                <Row>
                    <Col xs={2}>
                        <CloudSidemenu/>
                    </Col>

                    <Col>
                        <Modal show={show} onHide={handleClose}>
                            <Modal.Header closeButton>
                                <Modal.Title>Modal heading</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>Woohoo, you are reading this text in a modal!</Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={handleClose}>
                                    Close
                                </Button>
                                <Button variant="primary" onClick={handleClose}>
                                    Save Changes
                                </Button>
                            </Modal.Footer>
                        </Modal>
                        <Container>
                            <Row>
                                <Col xs={12}>
                                    <h1>Edit Profile</h1>
                                </Col>
                                <Col xs={12}>
                                    <Form className={"bg-white rounded-3 p-4"}>
                                        <Form.Group controlId="formGroupEmail" className={"mt-3"}>
                                            <Form.Label>Profile Photo</Form.Label>
                                            <Form.Control type="file" />
                                        </Form.Group>
                                        <Form.Group controlId="formGroupEmail" className={"mt-3"}>
                                            <Form.Label>Cover</Form.Label>
                                            <Form.Control type="file" />
                                        </Form.Group>
                                        <Form.Group controlId="formGroupEmail" className={"mt-3"}>
                                            <Form.Label>Username</Form.Label>
                                            <Form.Control type="text" placeholder="Username" />
                                        </Form.Group>
                                        <Button className={"w-100 mt-4"}>Save changes</Button>
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