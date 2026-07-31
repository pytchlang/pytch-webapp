import {NavBanner} from "../NavBanner";
import {Button, Col, Container, Row, Spinner} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {useNavigate} from "react-router-dom";
import {FormEvent, useEffect, useState} from "react";
import {PytchProgramKind} from "../../model/pytch-program-types";
import Card from "react-bootstrap/Card";
import {getUserProfile} from "../../model/cloud-storage";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faDownload} from "@fortawesome/free-solid-svg-icons";

class ProjectDto {
  id: string;
  program_kind: PytchProgramKind | undefined;
  created_at: string;
  updated_at: string;
  archived: boolean;

}

export default function Profile() {
  const [userProfile, setUserProfile] = useState(undefined);
  const [userProjects, setUserProjects] = useState(undefined);

  function handleUploadProject(e: FormEvent<HTMLFormElement>) {
      /*fetch(`http://127.0.0.1:8000/api/projects`, {
          method: "POST",
          headers: {
              'Authorization': `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify({
              title: e.target.
          })
      }

      fetch(`http://127.0.0.1:8000/api/projects/${projectId}/upload`, {
          method: "POST",
      }*/
  }

  function handleDownloadProject(project: ProjectDto) {
      console.log("download project");

      fetch(`http://127.0.0.1:8000/api/projects/${project.id}/download`, {
          method: "GET",
          headers: {
              'Authorization': `Bearer ${sessionStorage.getItem("token")}`,
          }
      })
          .then(res => {
              if (res.ok) {
                  return res.blob();
              }
              else {
                  throw new Error("Could not get user profile data");
              }
          })
          .then(blob => {
              console.log("project zip", blob);
              const url = window.URL.createObjectURL(blob);
              window.location.assign(url);

              const link = document.createElement('a');
              link.href = url;
              link.setAttribute(
                  'download',
                  `${project.title}.zip`,
              );

              // Append to html link element page
              document.body.appendChild(link);

              // Start download
              link.click();

              // Clean up and remove the link
              link.parentNode.removeChild(link);
          })
          .catch(err => {
              console.error(err);
              setUserProfile(null);
          })  }

  function getUserProjects() {
    console.log("getting user projects");

    fetch("http://127.0.0.1:8000/api/user-profile/projects", {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem("token")}`,
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
          sessionStorage.removeItem("token");
      };
  }

  function handleOpenProject(p: ProjectDto) {

  }

  useEffect(() => {
      fetchUser()

  }, [])

    const navigate = useNavigate();

    return (
      <>
        <NavBanner />
        <Container className={"m-5"}>
          <Row>
            <h1>Profile</h1>
          </Row>
          <Row>
            <Col xs={12}>
            {
              userProfile === undefined ?
                (
                    <Spinner/>
                )
            :
                userProfile === null ?
              (
                  <p>Could not load profile.</p>
              )
                :
              (
                <>
                  <p>Username: {userProfile.username}</p>
                  <p>Email: {userProfile.email}</p>
                  <p>Created at: {new Date(userProfile.created_at).toUTCString()}</p>
                </>
              )
            }
            </Col>
            <Col>
              <h2>My Cloud Projects</h2>
              {
                userProjects === undefined ?
                  (
                      <Spinner/>
                  )
                  :
                  userProjects === null ?
                    (
                        <p>Could not load user projects.</p>
                    )
                    :
                      userProjects.length > 0 ?
                          (
                              <Container>
                                <Row>
                                  {
                                    userProjects.map(
                                        (p: ProjectDto) => {
                                      return (
                                        <Col xs={6} className={"mt-2"}>
                                          <Card>
                                            <Card.Header>
                                                <h3>{p.title}</h3>
                                            </Card.Header>
                                            <Card.Body>
                                              <p>{p.program_kind}</p>
                                              <p>Created at: {new Date(p.created_at).toUTCString()}</p>
                                              <p>Updated at: {new Date(p.updated_at).toUTCString()}</p>
                                              <p>{p.status}</p>
                                              <p>{p.archived}</p>

                                            </Card.Body>
                                            <Card.Footer>
                                                <Button onClick={() => handleOpenProject(p)}>Open</Button>
                                                <Button onClick={() => handleDownloadProject(p)}><FontAwesomeIcon icon={faDownload}/>Download</Button>
                                            </Card.Footer>
                                          </Card>
                                        </Col>
                                      )}
                                    )
                                  }
                                </Row>
                              </Container>
                          )
                          :
                          (
                              <p>No projects found.</p>
                          )
              }
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>Upload project</Form.Label>
                    <Form.Control type="file" />
                </Form.Group>
                <Button className={"mb-5"} onClick={handleUploadProject}>Upload</Button>
            </Col>
          </Row>
            <Row>
                <Button onClick={() => {
                    sessionStorage.removeItem("token");
                    navigate("/");
                }}>Sign out</Button>
            </Row>
        </Container>
      </>
  )
}