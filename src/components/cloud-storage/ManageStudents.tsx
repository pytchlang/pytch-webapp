import {NavBanner} from "../NavBanner";
import {Button, Col, Container, Row, Table} from "react-bootstrap";
import {useNavigate} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {getUserProfile, signOutUser} from "../../model/cloud-storage";
import {useTranslation} from "react-i18next";
import Modal from 'react-bootstrap/Modal';
import CloudSidemenu from "./CloudSidemenu";

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
          signOutUser();
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
                            <h1>Manage Students</h1>
                        </Col>
                        <Col>
                            <Table striped bordered hover>
                                <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>E-Mail</th>
                                    <th>Created at</th>
                                    <th></th>
                                    <th><Button onClick={() => setShow(true)}>Add</Button></th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td>Mark</td>
                                    <td>Otto</td>
                                    <td>@mdo</td>
                                    <td>
                                        <Button>Reset password</Button>
                                    </td>
                                    <td>
                                        <Button>Delete</Button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Jacob</td>
                                    <td>Thornton</td>
                                    <td>@fat</td>
                                    <td>
                                        <Button>Reset password</Button>
                                    </td>
                                    <td>
                                        <Button>Delete</Button>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Larry</td>
                                    <td>Bird</td>
                                    <td>27.03.1994</td>
                                    <td>
                                        <Button>Reset password</Button>
                                    </td>
                                    <td>
                                        <Button>Delete</Button>
                                    </td>
                                </tr>
                                </tbody>
                            </Table>
                        </Col>
                    </Row>
                </Container>
            </Col>
          </Row>
        </Container>
      </>
  )
}