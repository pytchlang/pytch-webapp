import {NavBanner} from "../NavBanner";
import {Button, Col, Container, Row, Spinner, Table} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {Link, useNavigate} from "react-router-dom";
import React, {FormEvent, useEffect, useRef, useState} from "react";
import {PytchProgramKind} from "../../model/pytch-program-types";
import Card from "react-bootstrap/Card";
import {getUserProfile, signOutUser} from "../../model/cloud-storage";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faDownload} from "@fortawesome/free-solid-svg-icons";
import {useStoreActions, useStoreState} from "../../store";
import {cloudProjectFromId, demoURLFromId} from "../../storage/zipfile";
import LoadingOverlay from "../LoadingOverlay";
import { useTranslation } from "react-i18next";
import Modal from 'react-bootstrap/Modal';

class ProjectDto {
  id: string;
  program_kind: PytchProgramKind | undefined;
  created_at: string;
  updated_at: string;
  archived: boolean;

}

export default function Settings() {
  const [userProfile, setUserProfile] = useState(undefined);
  const [userProjects, setUserProjects] = useState(undefined);
  const fileRef = useRef(null);

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
          setUserProjects(data.data);
        })
        .catch(err => {
          console.error(err);
          setUserProfile(null);
            navigate("/");
        })
  }

  async function fetchUser() {
      try
      {
          const data = await getUserProfile();
          console.log("user profile", data);
          setUserProfile(data);
          getUserProjects();
      }
      catch(err) {
          console.error(err);
          setUserProfile(null);
          setUserProjects(null);
          signOutUser();
          navigate("/");
      }
  }

  const createProject = useStoreActions(
      (actions) => actions.demoFromZipfileURL.createProject
  );

    const setProposing = useStoreActions(
        (actions) => actions.demoFromZipfileURL.setProposing
    );

    const boot = useStoreActions((actions) => actions.demoFromZipfileURL.boot);

    function handleOpenProject(p: ProjectDto) {
      const cloudProjectUrl = cloudProjectFromId(p.id);
      boot(cloudProjectUrl);
  }

    const navigate = useNavigate();
    const demoState = useStoreState((state) => state.demoFromZipfileURL.state);
    const { t } = useTranslation("tutorials");

  useEffect(() => {
      fetchUser()

  }, [])

    useEffect(() => {
        switch (demoState.state) {
            case "proposing":
            case "creating":
                createProject();
        }
    }, [demoState.state]);

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
      <>
        <NavBanner />

        <Container className={"mx-auto mt-5"}>
          <Row>
              <Col xs={2}>
                  <ul>
                      <li><Link to={"/profile"}>Profile</Link></li>
                      <li><Link to={"/manage-students"}>Manage students</Link></li>
                      <li><Link to={"/settings"} style={{fontWeight: "bold"}}>Settings</Link></li>
                  </ul>
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
                            <h1>Settings</h1>
                        </Col>
                        <Col xs={12}>
                            <h2>Edit Profile</h2>
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
                        <Col xs={12}>
                            <h2>Change E-Mail</h2>
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
                        <Col xs={12}>
                            <h2>Change Password</h2>
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
            <Row>
                <Button onClick={() => {
                    signOutUser();
                    navigate("/");
                }}>Sign out</Button>
            </Row>
        </Container>
      </>
  )
}