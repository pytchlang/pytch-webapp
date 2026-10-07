import React from "react";
import { Button, Card, Col, Row, Spinner} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useStoreActions, useStoreState} from "../../store";
import {ProjectDto} from "../../model/project-core";
import {api} from "../../model/cloud-storage";
import {cloudProjectFromId} from "../../storage/zipfile";
import {faDownload} from "@fortawesome/free-solid-svg-icons";
import {getProgramKindIcon} from "../../model/discoverable-demos";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

type ListedProjectCardProps = {
    getUserProjects: () => void,
    setUserProfile: () => void,
    listedProject: ProjectDto
};

export const ListedProjectCard: React.FC<ListedProjectCardProps> = ({
                                                                        getUserProjects,
                                                                        setUserProfile,
                                                                        listedProject,
                                                                    }) => {


  async function handleDeleteProject(p: ProjectDto) {
    await api(`projects/${listedProject.id}`, {
      method: "DELETE",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
      }
    })

    getUserProjects()
  }

  function handleDownloadProject(project: ProjectDto) {
    console.log("download project");

    api(`projects/${project.id}/download`, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
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
        })
  }

  const boot = useStoreActions((actions) => actions.demoFromZipfileURL.boot);

  function handleOpenProject(p: ProjectDto) {
    const cloudProjectUrl = cloudProjectFromId(listedProject.id);
    boot(cloudProjectUrl);
  }

  const demoState = useStoreState((state) => state.demoFromZipfileURL.state);

  const programKindIcon = getProgramKindIcon(listedProject.program_kind);

  return (
  <Card
      className={"flex-row flex-wrap card"}
      tabIndex={0}
      data-demo-uuid={listedProject.id}
  >
    <Card.Header className={"p-0 w-100"}>
      <Row className={"pill-row w-100 p-3 m-0"}>
          <img src={programKindIcon.src} alt={programKindIcon.alt} />
          <Button onClick={() => handleDeleteProject(listedProject)}>Delete</Button>
      </Row>
    </Card.Header>
    <Card.Body className={"p-4 py-3"}>
        <h3>{listedProject.title}</h3>
      <Row className={"share-row"}>
        <Col sm={12} className={"d-flex justify-content-between p-0"}>
            <Button onClick={() => handleOpenProject(listedProject)}>{
                demoState.state === "booting"
                || demoState.state === "idle"
                    ? "Open" : (<Spinner/>)
            }</Button>
            <Button onClick={() => handleDownloadProject(listedProject)}><FontAwesomeIcon icon={faDownload}/>Download</Button>
            <p>Updated at: {new Date(listedProject.updated_at).toUTCString()}</p>
        </Col>
      </Row>
    </Card.Body>
  </Card>
);
};
