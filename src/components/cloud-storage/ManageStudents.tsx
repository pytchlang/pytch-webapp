import {NavBanner} from "../NavBanner";
import {Button, Col, Container, Row, Table} from "react-bootstrap";
import {useNavigate} from "react-router-dom";
import React, {FormEvent, useEffect, useState} from "react";
import {api, getUserProfile, parseRole, signOutUser, UserRole} from "../../model/cloud-storage";
import {useTranslation} from "react-i18next";
import Modal from 'react-bootstrap/Modal';
import CloudSidemenu from "./CloudSidemenu";
import Form from "react-bootstrap/Form";

export default function ManageStudents() {
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
            // signOutUser();
            // navigate("/");
        }
    }

    const navigate = useNavigate();
    const { t } = useTranslation("tutorials");

    useEffect(() => {
        fetchUser()
        getEducatorStudents()
    }, [])

    const [show, setShow] = useState(false);
    const [students, setStudents] = useState([])

    const handleClose = async (e) => {
        setShow(false);
    }
    const handleShow = () => setShow(true);

    const handleCreateUserAndClose = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let res = await api("sign-up-user", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: e.target.username.value,
                password: e.target.password.value,
                role: UserRole.STUDENT,
                created_by: userProfile.id,
            })
        });
        if (res.ok) {
            console.log("complete")
            setShow(false);
            getEducatorStudents();
        }
    }

    const getEducatorStudents = async () => {
        let res = await api("users/current-user-students", {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
            }
        });
        if (res.ok) {
            const data = await res.json();
            console.log("educator students", data.data);
            setStudents(data.data);
        }
        else {
            throw new Error(res.message)
        }
    }

    return (
        <>                <Modal show={show} onHide={handleClose}>
            <Form onSubmit={handleCreateUserAndClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Create student</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                            required
                            type="username"
                            placeholder="Enter username"
                            name="username"
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="password"
                            name="password"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" type={"submit"}>
                        Create User
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
            <Container>
                <Row>
                    <Col xs={12}>
                        <h1>Manage Students</h1>
                    </Col>
                    <Col>
                        <Table striped bordered hover>
                            <thead>
                            <tr>
                                <th>Username</th>
                                <th>Created at</th>
                                <th></th>
                                <th><Button onClick={() => setShow(true)}>Add</Button></th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                students.map((student) =>
                                    <tr>
                                        <td>{student.username}</td>
                                        <td>{student.created_at}</td>
                                        <td>
                                            <Button>Reset password</Button>
                                        </td>
                                        <td>
                                            <Button>Delete</Button>
                                        </td>
                                    </tr>
                                )
                            }
                            </tbody>
                        </Table>
                    </Col>
                </Row>
            </Container>
        </>
    )
}