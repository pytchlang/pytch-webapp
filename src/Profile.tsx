import {NavBanner} from "./components/NavBanner";
import {Button, Col, Container, Row, Spinner} from "react-bootstrap";
import Form from "react-bootstrap/Form";
import {useNavigate} from "react-router-dom";
import {FormEvent, useEffect, useState} from "react";
import {PytchProgramKind} from "./model/pytch-program-types";
import Card from "react-bootstrap/Card";
import {pathWithinApp} from "./env-utils";

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

  function handleDownloadProject(projectId: string) {
      console.log("download project");

      fetch(`http://127.0.0.1:8000/api/projects/${projectId}/download`, {
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
              var file = window.URL.createObjectURL(blob);
              window.location.assign(file);
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

  async function getUserProfile() {
    console.log("getting user profile");

    fetch("http://127.0.0.1:8000/api/user-profile", {
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
          console.log("user profile", data);
          setUserProfile(data);
          getUserProjects();
        })
        .catch(err => {
          console.error(err);
          setUserProfile(null);
          setUserProjects(null);
        })
  }

  useEffect(() => {
    getUserProfile();
  }, [])

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
                                            </Card.Header>
                                            <Card.Body>
                                              <h3>{p.title}</h3>
                                              <p>{p.program_kind}</p>
                                              <p>Created at: {new Date(p.created_at).toUTCString()}</p>
                                              <p>Updated at: {new Date(p.updated_at).toUTCString()}</p>
                                              <p>{p.status}</p>
                                              <p>{p.archived}</p>
                                                <Button onClick={() => handleDownloadProject(p.id)}>Download project</Button>
                                            </Card.Body>
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
            </Col>
          </Row>
        </Container>
      </>
  )
}